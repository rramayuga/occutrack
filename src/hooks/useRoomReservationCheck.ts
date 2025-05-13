
import { useEffect } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const updateRoomStatusBasedOnBookings = async () => {
      if (!user) return;
      
      try {
        // Get current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
        
        console.log(`Checking reservations at ${currentDate} ${currentTime}`);
        
        // Fetch today's reservations
        const { data: reservations, error } = await supabase
          .from('room_reservations')
          .select('*')
          .eq('date', currentDate)
          .neq('status', 'completed'); // Don't check completed reservations
        
        if (error) {
          console.error("Error fetching reservations:", error);
          throw error;
        }
        
        if (reservations && reservations.length > 0) {
          console.log('Found reservations for today:', reservations.length);
          
          for (const reservation of reservations) {
            const startTime = reservation.start_time;
            const endTime = reservation.end_time;
            
            // Check if current time is between start and end times
            const isActive = currentTime >= startTime && currentTime < endTime;
            const hasEnded = currentTime >= endTime;
            
            // Find the room
            const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
            
            if (roomToUpdate) {
              // Skip rooms under maintenance - they should not be changed by reservations
              if (roomToUpdate.status === 'maintenance') {
                console.log(`Room ${roomToUpdate.name} is under maintenance, skipping status update`);
                continue;
              }
              
              // Determine status and make updates
              if (isActive && roomToUpdate.status !== 'occupied') {
                // Start time reached but room not yet marked occupied
                console.log(`START TIME REACHED: Room ${roomToUpdate.name} should be occupied now`);
                updateRoomAvailability(reservation.room_id, false, 'occupied');
                
                toast({
                  title: "Room Now Occupied",
                  description: `${roomToUpdate.name} is now marked as occupied for the scheduled reservation.`,
                });
              } 
              else if (hasEnded && roomToUpdate.status !== 'available') {
                // End time reached but room not yet marked available
                console.log(`END TIME REACHED: Room ${roomToUpdate.name} should be available now`);
                updateRoomAvailability(reservation.room_id, true, 'available');
                
                // Mark the reservation as completed
                const { error: updateError } = await supabase
                  .from('room_reservations')
                  .update({ status: 'completed' })
                  .eq('id', reservation.id);
                
                if (updateError) {
                  console.error("Error marking reservation as completed:", updateError);
                } else {
                  console.log(`Successfully marked reservation ${reservation.id} as completed`);
                  toast({
                    title: "Reservation Completed",
                    description: `The reservation for ${roomToUpdate.name} has ended and the room is now available.`,
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error updating room status based on reservations:", error);
      }
    };

    // Update room status on load and every 15 seconds
    updateRoomStatusBasedOnBookings();
    const intervalId = setInterval(updateRoomStatusBasedOnBookings, 15000);
    
    return () => clearInterval(intervalId);
  }, [rooms, user, updateRoomAvailability, toast]);

  return null;
}
