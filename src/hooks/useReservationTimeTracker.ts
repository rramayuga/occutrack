
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
    console.log("Fetched active reservations:", reservations.length);
    setActiveReservations(reservations);
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch of active reservations
    fetchAndUpdateActiveReservations();
    console.log("Initial setup of reservation tracker");
    
    // Setup interval to check reservation times
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0];
      
      console.log(`Checking reservations at ${today} ${currentTime}`);
      
      activeReservations.forEach(reservation => {
        // Skip if already in completed list
        if (completedReservations.includes(reservation.id)) {
          console.log(`Reservation ${reservation.id} already marked as completed, skipping`);
          return;
        }
        
        // Check if reservation is for today
        if (reservation.date !== today) {
          console.log(`Reservation ${reservation.id} not for today (${reservation.date}), skipping`);
          return;
        }
        
        console.log(`Processing reservation ${reservation.id} - Start: ${reservation.startTime}, End: ${reservation.endTime}, Current: ${currentTime}`);
        
        // Check if start time has been reached - MARK AS OCCUPIED
        if (currentTime >= reservation.startTime && reservation.status !== 'occupied') {
          console.log(`Start time reached for reservation ${reservation.id} - marking room ${reservation.roomId} as OCCUPIED`);
          updateRoomStatus(reservation.roomId, true); // Mark as OCCUPIED at start time
        }
        
        // Check if end time has been reached - MARK AS AVAILABLE and REMOVE from schedule
        if (currentTime >= reservation.endTime) {
          console.log(`End time reached for reservation ${reservation.id} - marking room ${reservation.roomId} as AVAILABLE and completing reservation`);
          updateRoomStatus(reservation.roomId, false); // Mark as AVAILABLE at end time
          
          // Remove from active list and mark as completed
          markReservationAsCompleted(reservation.id).then((success) => {
            if (success) {
              console.log(`Successfully marked reservation ${reservation.id} as completed`);
              setActiveReservations(prev => prev.filter(r => r.id !== reservation.id));
            } else {
              console.error(`Failed to mark reservation ${reservation.id} as completed`);
            }
          });
        }
      });
    }, 30000); // Check every 30 seconds (increased frequency for more reliable updates)
    
    // Also set up a subscription to reservation changes
    const channel = supabase
      .channel('public:room_reservations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations',
        filter: user?.id ? `faculty_id=eq.${user.id}` : undefined
      }, (payload) => {
        console.log("Reservation change detected:", payload);
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
