
import { useEffect, useRef, useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const lastUpdateRef = useRef<Record<string, string>>({});
  const processedReservationsRef = useRef<Set<string>>(new Set());
  const updateInProgressRef = useRef<boolean>(false);
  const updateQueuedRef = useRef<boolean>(false);

  // Optimized function with debounce logic
  const updateRoomStatusBasedOnBookings = async () => {
    if (!user) return;
    
    // Skip if update is already in progress
    if (updateInProgressRef.current) {
      updateQueuedRef.current = true;
      console.log("[RESERVATION] Update already in progress, queuing next update");
      return;
    }
    
    updateInProgressRef.current = true;
    
    try {
      // Get current date and time with precision
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
      
      console.log(`[RESERVATION] Checking reservations at ${currentDate} ${currentTime}`);
      
      // Fetch only today's reservations to minimize data transfer
      const { data: todayReservations, error } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('date', currentDate);
      
      if (error) throw error;
      
      if (todayReservations) {
        // Update state once per check
        setReservations(todayReservations);
        
        // Process room status updates in batch for better performance
        const roomUpdates: Map<string, { isAvailable: boolean, status: RoomStatus }> = new Map();
        
        // First pass: identify all necessary room updates
        for (const reservation of todayReservations) {
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          // Check if current time is between start and end times
          const isActive = currentTime >= startTime && currentTime < endTime;
          
          // Find the room
          const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
          
          if (roomToUpdate) {
            // Skip rooms under maintenance - they should not be changed by reservations
            if (roomToUpdate.status === 'maintenance') {
              continue;
            }
            
            // Generate a status key for this reservation
            const reservationKey = `${reservation.id}-${isActive ? 'active' : 'inactive'}`;
            
            // Determine if the room status needs to be updated based on reservation time
            if (isActive && roomToUpdate.status !== 'occupied') {
              // Mark for update to occupied when reservation starts
              roomUpdates.set(reservation.room_id, { isAvailable: false, status: 'occupied' });
              
              // Show toast notification if we haven't already for this transition
              if (!lastUpdateRef.current[reservationKey]) {
                toast({
                  title: "Room Now Occupied",
                  description: `${roomToUpdate.name} is now occupied for a scheduled reservation.`,
                });
                lastUpdateRef.current[reservationKey] = currentDate;
              }
            } 
            else if (!isActive && currentTime >= endTime && roomToUpdate.status === 'occupied') {
              // Mark for update to available when reservation ends
              roomUpdates.set(reservation.room_id, { isAvailable: true, status: 'available' });
              
              // Show toast notification if we haven't already for this transition
              if (!lastUpdateRef.current[reservationKey]) {
                toast({
                  title: "Room Now Available",
                  description: `${roomToUpdate.name} is now available as the reservation has ended.`,
                });
                lastUpdateRef.current[reservationKey] = currentDate;
              }
              
              // Mark reservation for deletion if it has ended
              if (!processedReservationsRef.current.has(reservation.id)) {
                processedReservationsRef.current.add(reservation.id);
              }
            }
          }
        }
        
        // Second pass: apply all room updates
        for (const [roomId, update] of roomUpdates.entries()) {
          updateRoomAvailability(roomId, update.isAvailable, update.status);
        }
        
        // Batch delete completed reservations for efficiency
        const completedReservations = todayReservations.filter(reservation => 
          currentTime >= reservation.end_time && !processedReservationsRef.current.has(reservation.id)
        );
        
        if (completedReservations.length > 0) {
          try {
            for (const reservation of completedReservations) {
              if (!processedReservationsRef.current.has(reservation.id)) {
                const { error: deleteError } = await supabase
                  .from('room_reservations')
                  .delete()
                  .eq('id', reservation.id);
                
                if (!deleteError) {
                  processedReservationsRef.current.add(reservation.id);
                  console.log(`[RESERVATION] Completed reservation ${reservation.id} deleted`);
                }
              }
            }
          } catch (err) {
            console.error("[RESERVATION] Error batch deleting reservations:", err);
          }
        }
      }
    } catch (error) {
      console.error("[RESERVATION] Error updating room status based on reservations:", error);
    } finally {
      // Allow next update to proceed
      updateInProgressRef.current = false;
      
      // If an update was queued while this one was running, run it now
      if (updateQueuedRef.current) {
        updateQueuedRef.current = false;
        setTimeout(updateRoomStatusBasedOnBookings, 100); // Small delay to prevent tight loops
      }
    }
  };

  // Set up subscription for real-time updates
  useEffect(() => {
    // Run after a short delay to let component fully mount
    const initialTimeout = setTimeout(() => {
      updateRoomStatusBasedOnBookings();
    }, 1000);
    
    // Set up one shared subscription channel for all reservation-related events
    const reservationChannel = supabase
      .channel('optimized_reservation_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations' 
      }, () => {
        updateRoomStatusBasedOnBookings();
      })
      .subscribe();
    
    // Use a more efficient interval - every minute is enough
    const checkInterval = setInterval(() => {
      updateRoomStatusBasedOnBookings();
    }, 60000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(checkInterval);
      supabase.removeChannel(reservationChannel);
    };
  }, [rooms, user, updateRoomAvailability]);

  return { reservations };
}
