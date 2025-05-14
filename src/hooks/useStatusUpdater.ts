
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook specifically dedicated to checking and updating room status based on current time
 */
export function useStatusUpdater(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { toast } = useToast();
  const lastUpdateRef = useRef<Record<string, string>>({});

  const updateRoomStatuses = async () => {
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
              console.log(`[REAL-TIME] Room ${roomToUpdate.name} should now be OCCUPIED`);
              
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
              console.log(`[REAL-TIME] Room ${roomToUpdate.name} should now be AVAILABLE`);
              
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
      }
    } catch (error) {
      console.error("Error in useStatusUpdater:", error);
    }
  };

  useEffect(() => {
    // Run immediately on mount
    updateRoomStatuses();
    
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
    
    return () => {
      supabase.removeChannel(roomReservationChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [rooms]);
}
