
import { useEffect, useRef, useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const lastUpdateRef = useRef<Record<string, string>>({});

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
        console.log('Found reservations for today:', todayReservations.length);
        
        for (const reservation of todayReservations) {
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          // Check if current time is between start and end times (inclusive of start time)
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
            
            // Generate a key for this room status update
            const updateKey = `${roomToUpdate.id}-${shouldBeOccupied ? 'occupied' : 'available'}`;
            
            // Only update if status needs to change
            if ((shouldBeOccupied && roomToUpdate.status !== 'occupied') || 
                (shouldBeAvailable && roomToUpdate.status !== 'available')) {
              
              const newStatus = shouldBeOccupied ? 'occupied' : 'available';
              const isAvailable = newStatus === 'available';
              
              console.log(`Room ${roomToUpdate.name} status automatically updating to ${newStatus} based on reservation time`);
              
              // Check if we've already shown this toast today
              if (lastUpdateRef.current[updateKey] !== currentDate) {
                updateRoomAvailability(reservation.room_id, isAvailable, newStatus);
                
                // Show toast notification for automatic status changes
                if (shouldBeOccupied) {
                  toast({
                    title: "Room Now Occupied",
                    description: `${roomToUpdate.name} is now occupied due to a scheduled reservation.`,
                  });
                } else if (reservation.start_time < currentTime) {
                  // Only show "now available" toast if the reservation has actually ended
                  toast({
                    title: "Room Now Available",
                    description: `${roomToUpdate.name} is now available as the reservation period has ended.`,
                  });
                }
                
                // Remember we showed this toast today
                lastUpdateRef.current[updateKey] = currentDate;
              }
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
    
    // Set up subscription for current time changes
    const minuteTickerChannel = supabase
      .channel('time_updates')
      .on('broadcast', { event: 'minute-tick' }, () => {
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
    
    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(minuteTickerChannel);
      clearInterval(broadcastTimeUpdates);
    };
  }, [rooms, user, updateRoomAvailability]);

  return { reservations };
}
