
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
          .eq('date', currentDate);
        
        if (error) throw error;
        
        if (reservations && reservations.length > 0) {
          console.log('Found reservations for today:', reservations.length);
          
          for (const reservation of reservations) {
            const startTime = reservation.start_time;
            const endTime = reservation.end_time;
            
            // Check if current time is between start and end times
            const isActive = currentTime >= startTime && currentTime < endTime;
            
            // Find the room
            const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
            
            if (roomToUpdate) {
              // Skip rooms under maintenance - they should not be changed by reservations
              if (roomToUpdate.status === 'maintenance') {
                console.log(`Room ${roomToUpdate.name} is under maintenance, skipping status update`);
                continue;
              }
              
              // Determine if the room status needs to be updated based on reservation time
              const shouldBeOccupied = isActive;
              const shouldBeAvailable = !isActive;
              
              // Only update if status needs to change
              if ((shouldBeOccupied && roomToUpdate.status !== 'occupied') || 
                  (shouldBeAvailable && roomToUpdate.status !== 'available')) {
                
                const newStatus = shouldBeOccupied ? 'occupied' : 'available';
                const isAvailable = newStatus === 'available';
                
                console.log(`Room ${roomToUpdate.name} status automatically updating to ${newStatus} based on reservation time`);
                updateRoomAvailability(reservation.room_id, isAvailable, newStatus);
                
                // Show toast notification for automatic status changes
                if (shouldBeOccupied) {
                  toast({
                    title: "Room Now Occupied",
                    description: `${roomToUpdate.name} is now occupied due to a scheduled reservation.`,
                  });
                } else {
                  toast({
                    title: "Room Now Available",
                    description: `${roomToUpdate.name} is now available as the reservation period has ended.`,
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

    // Update room status on load and every minute
    updateRoomStatusBasedOnBookings();
    const intervalId = setInterval(updateRoomStatusBasedOnBookings, 60000);
    
    return () => clearInterval(intervalId);
  }, [rooms, user, updateRoomAvailability, toast]);

  return null; // This hook doesn't need to return anything
}
