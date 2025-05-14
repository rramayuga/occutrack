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

  // Function to check and update room statuses based on current time
  const updateRoomStatusBasedOnBookings = async () => {
    if (!user) return;
    
    try {
      // Get current date and time with precision
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
      
      console.log(`Checking reservations at ${currentDate} ${currentTime}`);
      
      // Fetch all of today's reservations (both past and upcoming)
      const { data: todayReservations, error } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('date', currentDate);
      
      if (error) throw error;
      
      if (todayReservations) {
        setReservations(todayReservations);
        
        // Check for completed reservations to delete
        const completedReservations = todayReservations.filter(reservation => {
          const endTime = reservation.end_time;
          return currentTime > endTime; // If current time is past the end time
        });
        
        // Process room status updates
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
              // Mark as occupied when reservation starts
              console.log(`Room ${roomToUpdate.name} marking as OCCUPIED based on active reservation`);
              updateRoomAvailability(reservation.room_id, false, 'occupied');
              
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
              // Mark as available when reservation ends
              console.log(`Room ${roomToUpdate.name} marking as AVAILABLE as reservation has ended`);
              updateRoomAvailability(reservation.room_id, true, 'available');
              
              // Show toast notification if we haven't already for this transition
              if (!lastUpdateRef.current[reservationKey]) {
                toast({
                  title: "Room Now Available",
                  description: `${roomToUpdate.name} is now available as the reservation has ended.`,
                });
                lastUpdateRef.current[reservationKey] = currentDate;
              }
              
              // If reservation has ended and it hasn't been processed yet, delete it
              if (!processedReservationsRef.current.has(reservation.id)) {
                const { error: deleteError } = await supabase
                  .from('room_reservations')
                  .delete()
                  .eq('id', reservation.id);
                
                if (!deleteError) {
                  // Mark this reservation as processed so we don't try to delete it again
                  processedReservationsRef.current.add(reservation.id);
                  console.log(`Reservation ${reservation.id} for room ${roomToUpdate.name} has been automatically deleted`);
                }
              }
            }
          }
        }
        
        // Bulk delete completed reservations that we haven't processed yet
        for (const reservation of completedReservations) {
          if (!processedReservationsRef.current.has(reservation.id)) {
            const { error: deleteError } = await supabase
              .from('room_reservations')
              .delete()
              .eq('id', reservation.id);
            
            if (!deleteError) {
              processedReservationsRef.current.add(reservation.id);
              console.log(`Completed reservation ${reservation.id} has been automatically deleted`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating room status based on reservations:", error);
    }
  };

  // Set up subscription for real-time updates to room_reservations
  useEffect(() => {
    // Run immediately on component mount
    updateRoomStatusBasedOnBookings();
    
    // Set up subscriptions
    const reservationChannel = supabase
      .channel('reservation_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations' 
      }, () => {
        // When any reservation changes, update statuses
        updateRoomStatusBasedOnBookings();
      })
      .subscribe();
    
    // Setup a broadcast every minute to handle time-based updates
    const broadcastTimeUpdates = setInterval(() => {
      supabase.channel('time_updates').send({
        type: 'broadcast',
        event: 'minute-tick',
        payload: { time: new Date().toISOString() }
      });
    }, 60000); // Check once per minute
    
    // Listen for broadcasts from other clients to keep in sync
    const minuteTickerChannel = supabase
      .channel('time_updates')
      .on('broadcast', { event: 'minute-tick' }, () => {
        updateRoomStatusBasedOnBookings();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(minuteTickerChannel);
      clearInterval(broadcastTimeUpdates);
    };
  }, [rooms, user, updateRoomAvailability]);

  return { reservations };
}
