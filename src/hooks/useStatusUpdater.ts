
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Optimized hook for checking and updating room status based on current time
 * with debounce to avoid excessive updates
 */
export function useStatusUpdater(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { toast } = useToast();
  const lastUpdateRef = useRef<Record<string, string>>({});
  const deletedReservationsRef = useRef<Set<string>>(new Set());
  const updateInProgressRef = useRef<boolean>(false);
  const updateQueuedRef = useRef<boolean>(false);
  
  // Optimized function with debounce logic
  const updateRoomStatuses = async () => {
    // Skip if an update is already in progress
    if (updateInProgressRef.current) {
      updateQueuedRef.current = true;
      console.log("[STATUS] Update already in progress, queuing next update");
      return;
    }
    
    updateInProgressRef.current = true;
    
    try {
      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentSecond = now.getSeconds().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}:${currentSecond}`;
      
      // Fetch all of today's reservations
      const { data: todayReservations, error } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('date', currentDate);
      
      if (error) throw error;
      
      if (todayReservations && todayReservations.length > 0) {
        // Find ended reservations that need to be removed
        const completedReservations = todayReservations.filter(reservation => {
          const endTime = `${reservation.end_time}:00`;
          return currentTime > endTime && !deletedReservationsRef.current.has(reservation.id);
        });
        
        // Process each reservation
        for (const reservation of todayReservations) {
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          // Add seconds format for more precise comparison
          const formattedStartTime = `${startTime}:00`;
          const formattedEndTime = `${endTime}:00`;
          
          // Check if current time is at the exact moment of room status change
          const shouldBeOccupied = currentTime >= formattedStartTime && currentTime < formattedEndTime;
          
          // Find the room
          const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
          
          if (roomToUpdate && roomToUpdate.status !== 'maintenance') {
            // Generate a key for this room status update
            const updateKey = `${roomToUpdate.id}-${shouldBeOccupied ? 'occupied' : 'available'}`;
            
            // Status needs to change to occupied
            if (shouldBeOccupied && roomToUpdate.status !== 'occupied') {
              console.log(`[STATUS] Room ${roomToUpdate.name} should now be OCCUPIED`);
              
              // Check if we've already shown this toast recently
              if (lastUpdateRef.current[updateKey] !== currentDate) {
                updateRoomAvailability(reservation.room_id, false, 'occupied');
                toast({
                  title: "Room Status Updated",
                  description: `${roomToUpdate.name} is now occupied due to scheduled reservation.`,
                });
                
                // Remember we showed this toast today
                lastUpdateRef.current[updateKey] = currentDate;
              }
            }
            // Status needs to change to available
            else if (!shouldBeOccupied && 
                     roomToUpdate.status === 'occupied' && 
                     currentTime >= formattedEndTime) {
              console.log(`[STATUS] Room ${roomToUpdate.name} should now be AVAILABLE`);
              
              // Check if we've already shown this toast recently
              if (lastUpdateRef.current[updateKey] !== currentDate) {
                updateRoomAvailability(reservation.room_id, true, 'available');
                toast({
                  title: "Room Status Updated",
                  description: `${roomToUpdate.name} is now available as the reservation has ended.`,
                });
                
                // Remember we showed this toast today
                lastUpdateRef.current[updateKey] = currentDate;
              }
            }
          }
        }
        
        // Delete any completed reservations (batch for efficiency)
        if (completedReservations.length > 0) {
          const completedIds = completedReservations.map(r => r.id);
          
          try {
            await Promise.all(completedReservations.map(async (reservation) => {
              if (!deletedReservationsRef.current.has(reservation.id)) {
                try {
                  const { error: deleteError } = await supabase
                    .from('room_reservations')
                    .delete()
                    .eq('id', reservation.id);
                  
                  if (!deleteError) {
                    deletedReservationsRef.current.add(reservation.id);
                    console.log(`[STATUS] Completed reservation ${reservation.id} deleted`);
                  }
                } catch (err) {
                  console.error(`[STATUS] Error deleting reservation ${reservation.id}:`, err);
                }
              }
            }));
          } catch (batchError) {
            console.error("[STATUS] Error in batch processing reservations:", batchError);
          }
        }
      }
    } catch (error) {
      console.error("[STATUS] Error in useStatusUpdater:", error);
    } finally {
      // Allow next update to proceed
      updateInProgressRef.current = false;
      
      // If an update was queued while this one was running, run it now
      if (updateQueuedRef.current) {
        updateQueuedRef.current = false;
        setTimeout(updateRoomStatuses, 100); // Small delay to prevent tight loops
      }
    }
  };

  useEffect(() => {
    // Run immediately on mount, but with a small delay to let other hooks initialize
    const initialTimeout = setTimeout(() => {
      updateRoomStatuses();
    }, 500);
    
    // Set up real-time subscription for room_reservations table
    const roomReservationChannel = supabase
      .channel('room_status_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations'
      }, () => {
        updateRoomStatuses();
      })
      .subscribe();
    
    // Set up real-time subscription for room table
    const roomChannel = supabase
      .channel('status_room_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms'
      }, () => {
        updateRoomStatuses();
      })
      .subscribe();
    
    // Use a more efficient interval for time updates - every 30 seconds instead of every minute
    const timeUpdateInterval = setInterval(() => {
      updateRoomStatuses();
    }, 30000);
    
    return () => {
      clearTimeout(initialTimeout);
      supabase.removeChannel(roomReservationChannel);
      supabase.removeChannel(roomChannel);
      clearInterval(timeUpdateInterval);
    };
  }, [rooms]);
}
