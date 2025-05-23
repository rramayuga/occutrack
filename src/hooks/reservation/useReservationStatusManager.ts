import { useState, useEffect, useCallback } from 'react';
import { Reservation } from '@/lib/types';
import { supabase, asSupabaseParam, safeDataAccess } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";

export function useReservationStatusManager() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [completedReservationIds, setCompletedReservationIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages

  // Fetch active reservations that aren't completed yet
  const fetchActiveReservations = useCallback(async () => {
    if (!user) return [];
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      console.log(`Fetching active reservations for date: ${today}`);
      
      // Use await to properly resolve the Promise
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
        setHasConnectionError(true);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("No active reservations found for today");
        setActiveReservations([]);
        setHasConnectionError(false);
        return [];
      }
      
      // Get building information for the reservations
      const buildingIds = Array.isArray(data) 
        ? data
          .filter(res => res.rooms?.building_id)
          .map(res => res.rooms?.building_id)
          .filter(Boolean)
        : [];
      
      let buildingMap: Record<string, string> = {};
      if (buildingIds.length > 0) {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds);
          
        if (buildingsError) {
          console.error("Error fetching buildings for reservations:", buildingsError);
          setHasConnectionError(true);
        } else if (buildingsData) {
          buildingMap = Array.isArray(buildingsData) ? buildingsData.reduce((acc, building) => {
            if (building && building.id) {
              acc[building.id] = building.name;
            }
            return acc;
          }, {} as Record<string, string>) : {};
        }
      }
      
      // Transform the data to match our Reservation type
      const reservations: Reservation[] = Array.isArray(data) 
        ? data
          .filter(item => item && typeof item === 'object')
          .map(item => ({
            id: item.id || '',
            roomId: item.room_id || '',
            roomNumber: item.rooms?.name || 'Unknown Room',
            building: item.rooms?.building_id ? buildingMap[item.rooms.building_id] || 'Unknown Building' : 'Unknown Building',
            date: item.date || '',
            startTime: item.start_time || '',
            endTime: item.end_time || '',
            purpose: item.purpose || '',
            status: item.status || 'approved',
            faculty: item.profiles?.name || 'Unknown Faculty'
          }))
          .filter(res => res.id && res.roomId)
        : [];
      
      console.log(`Found ${reservations.length} active reservations for today`);
      setActiveReservations(reservations);
      setHasConnectionError(false);
      return reservations;
    } catch (error) {
      console.error("Error in fetchActiveReservations:", error);
      setHasConnectionError(true);
      
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

  // Update room status based on reservation time
  const updateRoomStatus = useCallback(async (roomId: string, isOccupied: boolean) => {
    try {
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'}`);
      
      // First check if the room is in maintenance - don't change status if it is
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status, name')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error("Error fetching room status:", roomError);
        setHasConnectionError(true);
        return false;
      }
      
      if (roomData && roomData.status === 'maintenance') {
        console.log(`Room ${roomData.name} is under maintenance, skipping status update`);
        return false;
      }
      
      // Update the room status in the database
      const status = isOccupied ? 'occupied' : 'available';
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: status, 
          is_available: !isOccupied 
        })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        setHasConnectionError(true);
        return false;
      }
      
      console.log(`Successfully updated room ${roomId} status to ${status}`);
      setHasConnectionError(false);
      
      return true;
    } catch (error) {
      console.error("Error in updateRoomStatus:", error);
      setHasConnectionError(true);
      return false;
    }
  }, []);

  // Mark a reservation as completed
  const markReservationAsCompleted = useCallback(async (reservationId: string) => {
    try {
      console.log(`Marking reservation ${reservationId} as completed`);
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        setHasConnectionError(true);
        return false;
      }
      
      setCompletedReservationIds(prev => [...prev, reservationId]);
      setHasConnectionError(false);
      return true;
    } catch (error) {
      console.error("Error in markReservationAsCompleted:", error);
      setHasConnectionError(true);
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
    
    try {
      // Get current reservations to process
      let reservationsToProcess = activeReservations;
      const now = new Date();
      
      // Force refresh if it's been a while
      if (now.getTime() - lastCheck.getTime() > 30000) { // 30 seconds
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
        
        // Check if start time has been reached - MARK AS OCCUPIED
        if (compareTimeStrings(currentTime, reservation.startTime) >= 0 && 
            compareTimeStrings(currentTime, reservation.endTime) < 0) {
          console.log(`START TIME REACHED for reservation ${reservation.id} - marking room ${reservation.roomId} as OCCUPIED`);
          await updateRoomStatus(reservation.roomId, true);
          updated = true;
        }
        
        // Check if end time has been reached - MARK AS AVAILABLE and COMPLETE reservation
        if (compareTimeStrings(currentTime, reservation.endTime) >= 0) {
          console.log(`END TIME REACHED for reservation ${reservation.id} - completing reservation and marking room available`);
          await updateRoomStatus(reservation.roomId, false);
          await markReservationAsCompleted(reservation.id);
          
          // Remove from active reservations
          setActiveReservations(prev => prev.filter(r => r.id !== reservation.id));
          updated = true;
        }
      }
      
      // If any updates were made, refresh the reservations
      if (updated) {
        await fetchActiveReservations();
      }
      
      // Connection is working if we got here
      setHasConnectionError(false);
    } catch (error) {
      console.error("Error processing reservations:", error);
      setHasConnectionError(true);
    }
  }, [activeReservations, completedReservationIds, updateRoomStatus, markReservationAsCompleted, fetchActiveReservations, lastCheck, compareTimeStrings, user]);

  // Setup checks for reservation status changes
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up reservation status manager with user:", user.id);
    
    // Do initial fetch of active reservations
    fetchActiveReservations().catch(err => {
      console.error("Initial fetch error:", err);
      setHasConnectionError(true);
    });
    
    // Process reservations immediately
    processReservations().catch(err => {
      console.error("Initial processing error:", err);
      setHasConnectionError(true);
    });
    
    // Set up interval to check more frequently
    const intervalId = setInterval(() => {
      console.log("Checking reservation statuses");
      processReservations().catch(err => {
        console.error("Interval processing error:", err);
        setHasConnectionError(true);
      });
    }, 30000); // Check every 30 seconds (increased from 5 seconds to reduce load)
    
    // Set up realtime subscription to reservation changes
    let channel: any = null;
    try {
      channel = supabase
        .channel('reservation-status-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations',
        }, () => {
          console.log("Reservation change detected, refreshing data");
          fetchActiveReservations().catch(console.error);
          processReservations().catch(console.error);
        })
        .subscribe((status: string) => {
          console.log("Reservation subscription status:", status);
          if (status !== 'SUBSCRIBED') {
            setHasConnectionError(true);
          } else {
            setHasConnectionError(false);
          }
        });
      
      return () => {
        clearInterval(intervalId);
        if (channel) supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error setting up reservation status subscription:", error);
      setHasConnectionError(true);
      
      // If subscription fails, rely on interval checks
      return () => clearInterval(intervalId);
    }
  }, [user, fetchActiveReservations, processReservations]);

  return {
    activeReservations,
    completedReservationIds,
    hasConnectionError,
    fetchActiveReservations,
    markReservationAsCompleted,
    updateRoomStatus,
    processReservations
  };
}
