
import { useEffect, useRef } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useReservationStatusManager } from './useReservationStatusManager';

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { activeReservations } = useReservationStatusManager();
  
  // Use ref to track the last check time to prevent excessive checks
  const lastCheckTime = useRef<Date>(new Date());
  
  // Compare times in HH:MM format
  const compareTimeStrings = (time1: string, time2: string): number => {
    // Parse times to ensure proper comparison (handles formats like "09:30" vs "9:30")
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    if (hours1 !== hours2) {
      return hours1 - hours2;
    }
    return minutes1 - minutes2;
  };
  
  // This effect will run only when active reservations change
  useEffect(() => {
    if (!user || activeReservations.length === 0) return;
    
    // Check if it's been at least 15 seconds since the last check
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastCheckTime.current.getTime();
    if (timeSinceLastCheck < 15000) { // 15 seconds minimum between checks
      return;
    }
    
    lastCheckTime.current = now;
    
    const updateRoomStatusBasedOnReservations = async () => {
      try {
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
        
        console.log(`Checking room statuses at ${currentDate} ${currentTime} based on ${activeReservations.length} reservations`);
        
        // Process each active reservation
        for (const reservation of activeReservations) {
          // Skip if not for today
          if (reservation.date !== currentDate) continue;
          
          const startTime = reservation.startTime;
          const endTime = reservation.endTime;
          
          // FIX: Using a proper time comparison function instead of string comparison
          // Check if current time is between start and end times
          const isActive = compareTimeStrings(currentTime, startTime) >= 0 && 
                          compareTimeStrings(currentTime, endTime) < 0;
          const hasEnded = compareTimeStrings(currentTime, endTime) >= 0;
          
          // Find the room to update
          const roomToUpdate = rooms.find(r => r.id === reservation.roomId);
          
          if (roomToUpdate) {
            // Skip rooms under maintenance
            if (roomToUpdate.status === 'maintenance') {
              console.log(`Room ${roomToUpdate.name} is under maintenance, skipping status update`);
              continue;
            }
            
            // Update room status based on reservation time
            if (isActive && roomToUpdate.status !== 'occupied') {
              console.log(`Room ${roomToUpdate.name} should be occupied now based on reservation ${reservation.id}`);
              updateRoomAvailability(reservation.roomId, false, 'occupied');
            } 
            else if (hasEnded && roomToUpdate.status !== 'available') {
              console.log(`Room ${roomToUpdate.name} should be available now as reservation ${reservation.id} has ended`);
              updateRoomAvailability(reservation.roomId, true, 'available');
            }
          }
        }
      } catch (error) {
        console.error("Error updating room status based on reservations:", error);
      }
    };

    updateRoomStatusBasedOnReservations();
    
  }, [user, rooms, activeReservations, updateRoomAvailability]);

  return null;
}
