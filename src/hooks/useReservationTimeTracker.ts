
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
    if (!user) return;
    
    const reservations = await fetchActiveReservations();
    console.log("Fetched active reservations:", reservations.length);
    setActiveReservations(reservations);
    return reservations;
  }, [user, fetchActiveReservations]);

  // Function to check and update reservation statuses
  const checkReservationTimes = useCallback(async () => {
    if (!user || activeReservations.length === 0) return;
    
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const today = now.toISOString().split('T')[0];
    
    console.log(`Checking ${activeReservations.length} reservations at ${today} ${currentTime}`);
    
    let reservationsUpdated = false;
    
    for (const reservation of activeReservations) {
      // Skip if already in completed list
      if (completedReservations.includes(reservation.id)) {
        console.log(`Reservation ${reservation.id} already marked as completed, skipping`);
        continue;
      }
      
      // Check if reservation is for today
      if (reservation.date !== today) {
        console.log(`Reservation ${reservation.id} not for today (${reservation.date}), skipping`);
        continue;
      }
      
      console.log(`Processing reservation ${reservation.id} - Start: ${reservation.startTime}, End: ${reservation.endTime}, Current: ${currentTime}`);
      
      // Check if start time has been reached - MARK AS OCCUPIED
      if (currentTime >= reservation.startTime && reservation.status !== 'occupied') {
        console.log(`START TIME REACHED for reservation ${reservation.id} - marking room ${reservation.roomId} as OCCUPIED`);
        await updateRoomStatus(reservation.roomId, true);
        toast({
          title: "Room Now Occupied",
          description: `${reservation.roomNumber} is now occupied for your scheduled reservation.`,
        });
        reservationsUpdated = true;
      }
      
      // Check if end time has been reached - MARK AS AVAILABLE and COMPLETE reservation
      if (currentTime >= reservation.endTime) {
        console.log(`END TIME REACHED for reservation ${reservation.id} - completing reservation and marking room available`);
        await updateRoomStatus(reservation.roomId, false);
        
        // Mark reservation as completed
        const success = await markReservationAsCompleted(reservation.id);
        if (success) {
          console.log(`Successfully marked reservation ${reservation.id} as completed`);
          toast({
            title: "Reservation Completed",
            description: `Your reservation in ${reservation.roomNumber} has ended and the room is now available.`,
          });
          reservationsUpdated = true;
        } else {
          console.error(`Failed to mark reservation ${reservation.id} as completed`);
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
    
    // Setup interval to check reservation times more frequently (every 5 seconds for more real-time updates)
    const intervalId = setInterval(checkReservationTimes, 5000);
    
    // Also set up a subscription to reservation changes
    const channel = supabase
      .channel('room_reservations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations'
      }, (payload) => {
        console.log("Reservation change detected:", payload);
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
