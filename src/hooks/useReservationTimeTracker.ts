
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
    const today = now.toISOString().split('T')[0];
    
    console.log(`Checking ${activeReservations.length} reservations at ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    
    let reservationsUpdated = false;
    
    for (const reservation of activeReservations) {
      // Skip if already completed
      if (completedReservations.includes(reservation.id)) {
        continue;
      }
      
      // Check if reservation is for today
      if (reservation.date !== today) {
        continue;
      }
      
      // Parse start and end times for comparison
      const [startHours, startMinutes] = reservation.startTime.split(':').map(Number);
      const [endHours, endMinutes] = reservation.endTime.split(':').map(Number);
      
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();
      const nowSeconds = now.getSeconds();
      
      console.log(`Reservation ${reservation.id}: Time now ${nowHours}:${nowMinutes}:${nowSeconds}, Start ${startHours}:${startMinutes}, End ${endHours}:${endMinutes}`);
      
      // Check if start time has been reached but not end time - MARK AS OCCUPIED
      if ((nowHours > startHours || (nowHours === startHours && nowMinutes >= startMinutes)) && 
          (nowHours < endHours || (nowHours === endHours && nowMinutes < endMinutes)) && 
          reservation.status !== 'completed') {
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
      if ((nowHours > endHours || (nowHours === endHours && nowMinutes >= endMinutes)) && 
          reservation.status !== 'completed') {
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
    
    // Setup interval to check reservation times every 3 seconds for real-time updates
    const intervalId = setInterval(() => {
      console.log("Running periodic reservation check");
      checkReservationTimes();
    }, 3000);
    
    // Subscribe to reservation changes
    const reservationChannel = supabase
      .channel('room_reservations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations'
      }, () => {
        console.log("Detected changes in reservations table, refreshing");
        fetchAndUpdateActiveReservations();
        checkReservationTimes();
      })
      .subscribe();
      
    // Subscribe to room status changes  
    const roomsChannel = supabase
      .channel('room_status_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms'
      }, () => {
        console.log("Detected changes in rooms table, refreshing");
        fetchAndUpdateActiveReservations();
        checkReservationTimes();
      })
      .subscribe();
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(roomsChannel);
    };
  }, [user, fetchAndUpdateActiveReservations, checkReservationTimes]);

  return {
    activeReservations,
    completedReservations,
    fetchActiveReservations: fetchAndUpdateActiveReservations
  };
}
