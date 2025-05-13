
import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";
import { useFetchActiveReservations } from './reservation/useFetchActiveReservations';
import { useRoomStatusManager } from './reservation/useRoomStatusManager';
import { useReservationCompleter } from './reservation/useReservationCompleter';

export function useReservationTimeTracker() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const { user } = useAuth();
  const { fetchActiveReservations } = useFetchActiveReservations();
  const { updateRoomStatus } = useRoomStatusManager();
  const { completedReservations, markReservationAsCompleted } = useReservationCompleter();

  // Function to fetch and update the active reservations
  const fetchAndUpdateActiveReservations = async () => {
    if (!user) return;
    
    const reservations = await fetchActiveReservations();
    setActiveReservations(reservations);
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch of active reservations
    fetchAndUpdateActiveReservations();
    
    // Setup interval to check reservation times
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0];
      
      activeReservations.forEach(reservation => {
        // Skip if already in completed list
        if (completedReservations.includes(reservation.id)) return;
        
        // Check if reservation is for today
        if (reservation.date !== today) return;
        
        // Check if start time has been reached - MARK AS OCCUPIED
        if (currentTime >= reservation.startTime && reservation.status !== 'occupied') {
          console.log(`Start time reached for reservation ${reservation.id} - marking room as OCCUPIED`);
          updateRoomStatus(reservation.roomId, true); // Mark as OCCUPIED at start time
        }
        
        // Check if end time has been reached - MARK AS AVAILABLE and REMOVE from schedule
        if (currentTime >= reservation.endTime) {
          console.log(`End time reached for reservation ${reservation.id} - marking room as AVAILABLE and removing reservation`);
          updateRoomStatus(reservation.roomId, false); // Mark as AVAILABLE at end time
          
          // Remove from active list and mark as completed
          markReservationAsCompleted(reservation.id).then((success) => {
            if (success) {
              setActiveReservations(prev => prev.filter(r => r.id !== reservation.id));
            }
          });
        }
      });
    }, 60000); // Check every minute
    
    // Also set up a subscription to reservation changes
    const channel = supabase
      .channel('public:room_reservations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations',
        filter: `faculty_id=eq.${user.id}`
      }, () => {
        fetchAndUpdateActiveReservations();
      })
      .subscribe();
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user, activeReservations, completedReservations]);

  return {
    activeReservations,
    completedReservations,
    fetchActiveReservations: fetchAndUpdateActiveReservations
  };
}
