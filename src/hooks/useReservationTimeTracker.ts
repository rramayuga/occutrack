
import { useState, useEffect, useCallback } from 'react';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";
import { useFetchActiveReservations } from './reservation/useFetchActiveReservations';
import { useRoomStatusManager } from './reservation/useRoomStatusManager';
import { useReservationCompleter } from './reservation/useReservationCompleter';
import { useToast } from "@/hooks/use-toast";

export function useReservationTimeTracker() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const { user } = useAuth();
  const { fetchActiveReservations } = useFetchActiveReservations();
  const { updateRoomStatus } = useRoomStatusManager();
  const { completedReservations, markReservationAsCompleted } = useReservationCompleter();
  const { toast } = useToast();

  // Function to fetch and update the active reservations
  const fetchAndUpdateActiveReservations = useCallback(async () => {
    if (!user) return [];
    
    const reservations = await fetchActiveReservations();
    console.log("Fetched active reservations:", reservations.length);
    setActiveReservations(reservations);
    return reservations;
  }, [user, fetchActiveReservations]);

  // Function to check and update reservation statuses
  const checkReservationTimes = useCallback(async () => {
    if (!user || activeReservations.length === 0) return;
    
    const now = new Date();
    
    // Format time as HH:MM for accurate comparison
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    const today = now.toISOString().split('T')[0];
    
    console.log(`Checking ${activeReservations.length} reservations at ${today} ${currentTime}`);
    
    let reservationsUpdated = false;
    
    for (const reservation of activeReservations) {
      // Skip if already in completed list
      if (completedReservations.includes(reservation.id)) {
        continue;
      }
      
      // Check if reservation is for today
      if (reservation.date !== today) {
        continue;
      }
      
      // For more accurate time comparison, compare timestamps
      const startTimeParts = reservation.startTime.split(':').map(Number);
      const endTimeParts = reservation.endTime.split(':').map(Number);
      
      const reservationStart = new Date();
      reservationStart.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
      
      const reservationEnd = new Date();
      reservationEnd.setHours(endTimeParts[0], endTimeParts[1], 0, 0);
      
      const isStartTimeReached = now >= reservationStart;
      const isEndTimeReached = now >= reservationEnd;
      
      console.log(`Reservation ${reservation.id}: Start=${reservation.startTime}, End=${reservation.endTime}, Current=${currentTime}`);
      console.log(`Start time reached: ${isStartTimeReached}, End time reached: ${isEndTimeReached}`);
      
      // Check if start time has been reached - MARK AS OCCUPIED
      if (isStartTimeReached && !isEndTimeReached && reservation.status !== 'occupied') {
        console.log(`START TIME REACHED for reservation ${reservation.id} - marking room ${reservation.roomId} as OCCUPIED`);
        const success = await updateRoomStatus(reservation.roomId, true);
        if (success) {
          toast({
            title: "Room Now Occupied",
            description: `${reservation.roomNumber} is now occupied for the scheduled reservation.`,
          });
          reservationsUpdated = true;
        }
      }
      
      // Check if end time has been reached - MARK AS AVAILABLE and COMPLETE reservation
      if (isEndTimeReached) {
        console.log(`END TIME REACHED for reservation ${reservation.id} - completing reservation and marking room available`);
        const success = await updateRoomStatus(reservation.roomId, false);
        
        // Mark reservation as completed
        if (success) {
          const completionSuccess = await markReservationAsCompleted(reservation.id);
          if (completionSuccess) {
            console.log(`Successfully marked reservation ${reservation.id} as completed`);
            toast({
              title: "Reservation Completed",
              description: `Reservation in ${reservation.roomNumber} has ended and the room is now available.`,
            });
            reservationsUpdated = true;
          }
        }
      }
    }
    
    // If any reservations were updated, refresh the list
    if (reservationsUpdated) {
      await fetchAndUpdateActiveReservations();
    }
  }, [activeReservations, completedReservations, fetchAndUpdateActiveReservations, markReservationAsCompleted, updateRoomStatus, user, toast]);

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch and setup
    fetchAndUpdateActiveReservations();
    console.log("Initial setup of reservation tracker");
    
    // Check status immediately and then set interval
    checkReservationTimes();
    
    // Setup interval to check reservation times every second for real-time updates
    const intervalId = setInterval(checkReservationTimes, 1000);
    
    // Also set up a subscription to reservation changes
    const channel = supabase
      .channel('room_reservations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations'
      }, () => {
        fetchAndUpdateActiveReservations();
      })
      .subscribe();
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user, fetchAndUpdateActiveReservations, checkReservationTimes]);

  return {
    activeReservations,
    completedReservations,
    fetchActiveReservations: fetchAndUpdateActiveReservations
  };
}
