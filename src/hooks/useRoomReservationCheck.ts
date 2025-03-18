
import { useEffect } from 'react';
import { Room } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean) => void) {
  const { user } = useAuth();

  useEffect(() => {
    const updateRoomStatusBasedOnBookings = async () => {
      if (!user) return;
      
      try {
        // Get current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
        
        // Fetch today's reservations
        const { data: reservations, error } = await supabase
          .from('room_reservations')
          .select('*')
          .eq('date', currentDate);
        
        if (error) throw error;
        
        if (reservations && reservations.length > 0) {
          console.log('Checking reservations for updates:', reservations);
          
          for (const reservation of reservations) {
            const startTime = reservation.start_time;
            const endTime = reservation.end_time;
            
            // Check if current time is between start and end times
            const isActive = currentTime >= startTime && currentTime < endTime;
            
            // Find the room
            const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
            
            if (roomToUpdate) {
              // Only update if status needs to change
              if ((isActive && roomToUpdate.isAvailable) || (!isActive && !roomToUpdate.isAvailable)) {
                updateRoomAvailability(reservation.room_id, !isActive);
                console.log(`Room ${roomToUpdate.name} status updated to ${!isActive ? 'available' : 'occupied'}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error updating room status:", error);
      }
    };

    // Update room status on load and every minute
    updateRoomStatusBasedOnBookings();
    const intervalId = setInterval(updateRoomStatusBasedOnBookings, 60000);
    
    return () => clearInterval(intervalId);
  }, [rooms, user, updateRoomAvailability]);

  return null; // This hook doesn't need to return anything
}
