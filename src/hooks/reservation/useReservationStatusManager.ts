
import { useState, useEffect, useCallback, useRef } from 'react';
import { Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { useRoomStatusManager } from './useRoomStatusManager';

export function useReservationStatusManager() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [completedReservationIds, setCompletedReservationIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateRoomStatus } = useRoomStatusManager();
  
  // Tracking system for reservation status transitions
  const reservationStatusCache = useRef<Map<string, {
    status: string,
    roomStatus: string,
    lastProcessed: number
  }>>(new Map());
  
  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages

  // Fetch active reservations that aren't completed yet
  const fetchActiveReservations = useCallback(async () => {
    if (!user) return [];
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      console.log(`Fetching active reservations for date: ${today}`);
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          purpose,
          status,
          faculty_id,
          rooms:room_id(name, building_id),
          profiles:faculty_id(name)
        `)
        .eq('date', today)
        .neq('status', 'completed');
      
      if (error) {
        console.error("Error fetching active reservations:", error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("No active reservations found for today");
        setActiveReservations([]);
        return [];
      }
      
      // Get building information for the reservations
      const buildingIds = data.map(res => res.rooms?.building_id).filter(Boolean);
      
      let buildingMap: Record<string, string> = {};
      if (buildingIds.length > 0) {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds);
          
        if (!buildingsError && buildingsData) {
          buildingMap = buildingsData.reduce((acc, building) => {
            acc[building.id] = building.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Transform the data to match our Reservation type
      const reservations: Reservation[] = data.map(item => ({
        id: item.id,
        roomId: item.room_id,
        roomNumber: item.rooms?.name || 'Unknown Room',
        building: item.rooms?.building_id ? buildingMap[item.rooms.building_id] || 'Unknown Building' : 'Unknown Building',
        date: item.date,
        startTime: item.start_time,
        endTime: item.end_time,
        purpose: item.purpose || '',
        status: item.status,
        faculty: item.profiles?.name || 'Unknown Faculty'
      }));
      
      console.log(`Found ${reservations.length} active reservations for today`);
      setActiveReservations(reservations);
      return reservations;
    } catch (error) {
      console.error("Error in fetchActiveReservations:", error);
      
      // Only show error toast if we haven't shown one recently
      const now = new Date();
      if (!lastError || now.getTime() - lastError.getTime() > ERROR_COOLDOWN_MS) {
        toast({
          title: "Error loading reservations",
          description: "Could not load reservation status data. Will retry automatically.",
          duration: 3000,
        });
        setLastError(now);
      }
      
      return [];
    }
  }, [user, toast, lastError]);

  // Mark a reservation as completed
  const markReservationAsCompleted = useCallback(async (reservationId: string) => {
    try {
      // Check if we've already processed this completion recently
      const cacheKey = `completion-${reservationId}`;
      const cached = reservationStatusCache.current.get(cacheKey);
      const now = Date.now();
      
      // Don't attempt to complete the same reservation multiple times
      if (cached && now - cached.lastProcessed < 300000) { // 5 minute cooldown
        console.log(`Skipping redundant completion for reservation ${reservationId} - processed recently`);
        return true;
      }
      
      console.log(`Marking reservation ${reservationId} as completed`);
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      // Track this in our cache
      reservationStatusCache.current.set(cacheKey, {
        status: 'completed',
        roomStatus: 'available',
        lastProcessed: now
      });
      
      setCompletedReservationIds(prev => [...prev, reservationId]);
      return true;
    } catch (error) {
      console.error("Error in markReservationAsCompleted:", error);
      return false;
    }
  }, []);

  // Compare times in HH:MM format with better precision
  const compareTimeStrings = useCallback((time1: string, time2: string): number => {
    // Parse times to ensure proper comparison
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    // Convert to minutes for easier comparison
    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;
    
    return totalMinutes1 - totalMinutes2;
  }, []);

  // Process active reservations to check for status changes
  const processReservations = useCallback(async () => {
    if (!user) {
      console.log("No user logged in, skipping reservation processing");
      return;
    }
    
    // Get current reservations to process
    let reservationsToProcess = activeReservations;
    const now = new Date();
    
    // Force refresh if it's been a while
    if (now.getTime() - lastCheck.getTime() > 60000) { // 60 seconds (increased from 30)
      console.log("Force refreshing reservations due to time elapsed");
      reservationsToProcess = await fetchActiveReservations();
      setLastCheck(now);
    }
    
    if (reservationsToProcess.length === 0) {
      console.log("No active reservations in state, fetching latest");
      reservationsToProcess = await fetchActiveReservations();
    }
    
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const today = now.toISOString().split('T')[0];
    
    console.log(`Processing ${reservationsToProcess.length} reservations at ${currentTime}`);
    let updated = false;
    
    for (const reservation of reservationsToProcess) {
      // Skip if already marked as completed
      if (completedReservationIds.includes(reservation.id) || reservation.status === 'completed') {
        continue;
      }
      
      // Skip if not for today
      if (reservation.date !== today) {
        continue;
      }
      
      // Get cache for this reservation
      const reservationKey = `reservation-${reservation.id}`;
      const cached = reservationStatusCache.current.get(reservationKey);
      const currentTimestamp = Date.now();
      
      // Check if start time has been reached - MARK AS OCCUPIED
      if (compareTimeStrings(currentTime, reservation.startTime) >= 0 && 
          compareTimeStrings(currentTime, reservation.endTime) < 0) {
        
        // If we've already marked this as occupied recently, skip
        if (cached && 
            cached.roomStatus === 'occupied' && 
            currentTimestamp - cached.lastProcessed < 600000) { // 10 minute cooldown
          console.log(`Skipping redundant occupied update for reservation ${reservation.id} - updated ${Math.round((currentTimestamp - cached.lastProcessed)/1000)}s ago`);
          continue;
        }
        
        console.log(`START TIME REACHED for reservation ${reservation.id} - marking room ${reservation.roomId} as OCCUPIED`);
        
        // Pass the reservation ID to updateRoomStatus for more precise tracking
        const success = await updateRoomStatus(reservation.roomId, true, reservation.id);
        
        if (success) {
          // Record this status update in our cache
          reservationStatusCache.current.set(reservationKey, {
            status: reservation.status,
            roomStatus: 'occupied',
            lastProcessed: currentTimestamp
          });
          
          updated = true;
        }
      }
      
      // Check if end time has been reached - MARK AS AVAILABLE and COMPLETE reservation
      if (compareTimeStrings(currentTime, reservation.endTime) >= 0) {
        // If we've already processed this completion recently, skip
        if (cached && 
            cached.status === 'completed' && 
            currentTimestamp - cached.lastProcessed < 600000) { // 10 minute cooldown
          console.log(`Skipping redundant completion for reservation ${reservation.id} - processed recently`);
          continue;
        }
        
        console.log(`END TIME REACHED for reservation ${reservation.id} - completing reservation and marking room available`);
        
        // Pass the reservation ID to updateRoomStatus for more precise tracking
        await updateRoomStatus(reservation.roomId, false, reservation.id);
        await markReservationAsCompleted(reservation.id);
        
        // Record this status update in our cache
        reservationStatusCache.current.set(reservationKey, {
          status: 'completed',
          roomStatus: 'available',
          lastProcessed: currentTimestamp
        });
        
        // Remove from active reservations
        setActiveReservations(prev => prev.filter(r => r.id !== reservation.id));
        updated = true;
      }
    }
    
    // If any updates were made, refresh the reservations but with a delay
    if (updated) {
      setTimeout(() => fetchActiveReservations(), 3000); // Delay refresh to allow database to update
    }
  }, [activeReservations, completedReservationIds, updateRoomStatus, markReservationAsCompleted, fetchActiveReservations, lastCheck, compareTimeStrings, user]);

  // Setup checks for reservation status changes - less frequent and with clearer cleanup
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up reservation status manager with user:", user.id);
    
    // Do initial fetch of active reservations
    fetchActiveReservations();
    
    // Process reservations immediately - this is important for initial state
    processReservations();
    
    // Set up interval to check LESS frequently - increase to 30 seconds 
    const intervalId = setInterval(() => {
      console.log("Periodic check of reservation statuses");
      processReservations();
    }, 30000); // Check every 30 seconds (increased from 5 seconds)
    
    // Set up realtime subscription to reservation changes
    let channel: any = null;
    
    try {
      channel = supabase
        .channel('reservation-status-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations',
        }, (payload) => {
          console.log("Reservation change detected via realtime:", payload);
          // Delay processing slightly to allow database to update fully
          setTimeout(() => {
            fetchActiveReservations();
            processReservations();
          }, 2000);
        })
        .subscribe((status) => {
          console.log("Realtime subscription status for reservations:", status);
        });
    } catch (error) {
      console.error("Error setting up reservation status subscription:", error);
    }
    
    return () => {
      console.log("Cleaning up reservation status manager");
      clearInterval(intervalId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchActiveReservations, processReservations]);

  return {
    activeReservations,
    completedReservationIds,
    fetchActiveReservations,
    markReservationAsCompleted,
    updateRoomStatus,
    processReservations
  };
}
