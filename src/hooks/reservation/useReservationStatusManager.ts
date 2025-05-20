
import { useState, useEffect, useCallback, useRef } from 'react';
import { Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";

export function useReservationStatusManager() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [completedReservationIds, setCompletedReservationIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [connectionError, setConnectionError] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 6;
  const { user } = useAuth();
  const { toast } = useToast();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages

  // Helper to create a new abort controller for a request
  const getAbortController = useCallback((requestId: string) => {
    // Cancel existing request with the same ID if it exists
    if (abortControllersRef.current.has(requestId)) {
      abortControllersRef.current.get(requestId)?.abort();
    }
    
    // Create new controller
    const controller = new AbortController();
    abortControllersRef.current.set(requestId, controller);
    
    // Set timeout for this request
    setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    return controller;
  }, []);

  // Fetch active reservations that aren't completed yet
  const fetchActiveReservations = useCallback(async () => {
    if (!user) return [];
    
    const requestId = 'fetchActiveReservations';
    const controller = getAbortController(requestId);
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      console.log(`Fetching active reservations for date: ${today}`);
      
      // Get reservations for today and future dates that aren't completed
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
        .gte('date', today)  // Get today and future dates
        .neq('status', 'completed')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .abortSignal(controller.signal);
      
      if (error) {
        console.error("Error fetching active reservations:", error);
        setConnectionError(true);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("No active reservations found");
        setActiveReservations([]);
        setConnectionError(false);
        retryCount.current = 0;
        return [];
      }
      
      // Get building information for the reservations
      const buildingIds = data
        .map(res => res.rooms?.building_id)
        .filter(Boolean) as string[];
      
      let buildingMap: Record<string, string> = {};
      if (buildingIds.length > 0) {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds)
          .abortSignal(controller.signal);
          
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
      
      console.log(`Found ${reservations.length} active reservations`);
      setActiveReservations(reservations);
      setConnectionError(false);
      retryCount.current = 0;
      return reservations;
    } catch (error: any) {
      // Don't treat aborted requests as errors
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return [];
      }
      
      console.error("Error in fetchActiveReservations:", error);
      
      // Increment retry count
      retryCount.current++;
      
      // Set connection error status
      setConnectionError(true);
      
      // Only show error toast if we haven't shown one recently and we haven't exceeded retry limit
      const now = new Date();
      if ((!lastError || now.getTime() - lastError.getTime() > ERROR_COOLDOWN_MS) && 
          retryCount.current <= maxRetries) {
        toast({
          title: "Error loading reservations",
          description: "Could not load reservation status data. Will retry automatically.",
          duration: 3000,
          variant: "destructive"
        });
        setLastError(now);
      }
      
      if (retryCount.current > maxRetries) {
        console.log(`Maximum retry attempts (${maxRetries}) exceeded. Giving up.`);
      }
      
      return [];
    } finally {
      // Remove the controller from our map
      setTimeout(() => {
        abortControllersRef.current.delete(requestId);
      }, 1000);
    }
  }, [user, toast, lastError, getAbortController]);

  // Update room status based on reservation time
  const updateRoomStatus = useCallback(async (roomId: string, isOccupied: boolean) => {
    if (!user) return false;
    
    const requestId = `updateRoomStatus-${roomId}-${isOccupied}`;
    const controller = getAbortController(requestId);
    
    try {
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'}`);
      
      // First check if the room is in maintenance - don't change status if it is
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status, name')
        .eq('id', roomId)
        .maybeSingle()
        .abortSignal(controller.signal);
      
      if (roomError) {
        console.error("Error fetching room status:", roomError);
        return false;
      }
      
      if (roomData?.status === 'maintenance') {
        console.log(`Room ${roomData.name} is under maintenance, skipping status update`);
        return false;
      }
      
      // Update the room status and availability in the database
      const status = isOccupied ? 'occupied' : 'available';
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status, 
          is_available: !isOccupied 
        })
        .eq('id', roomId)
        .abortSignal(controller.signal);
      
      if (error) {
        console.error("Error updating room status:", error);
        return false;
      }
      
      console.log(`Successfully updated room ${roomId} status to ${status}`);
      setConnectionError(false);
      return true;
    } catch (error: any) {
      // Don't treat aborted requests as errors
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return false;
      }
      
      console.error("Error in updateRoomStatus:", error);
      setConnectionError(true);
      return false;
    } finally {
      // Remove the controller from our map
      setTimeout(() => {
        abortControllersRef.current.delete(requestId);
      }, 1000);
    }
  }, [user, getAbortController]);

  // Mark a reservation as completed
  const markReservationAsCompleted = useCallback(async (reservationId: string) => {
    if (!user) return false;
    
    const requestId = `markCompleted-${reservationId}`;
    const controller = getAbortController(requestId);
    
    try {
      console.log(`Marking reservation ${reservationId} as completed`);
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId)
        .abortSignal(controller.signal);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      setCompletedReservationIds(prev => [...prev, reservationId]);
      setConnectionError(false);
      return true;
    } catch (error: any) {
      // Don't treat aborted requests as errors
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return false;
      }
      
      console.error("Error in markReservationAsCompleted:", error);
      setConnectionError(true);
      return false;
    } finally {
      // Remove the controller from our map
      setTimeout(() => {
        abortControllersRef.current.delete(requestId);
      }, 1000);
    }
  }, [user, getAbortController]);

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
    if (now.getTime() - lastCheck.getTime() > 10000) { // 10 seconds for more frequent checks
      console.log("Force refreshing reservations due to time elapsed");
      try {
        reservationsToProcess = await fetchActiveReservations();
        setLastCheck(now);
      } catch (error) {
        console.error("Error refreshing reservations:", error);
      }
    }
    
    if (reservationsToProcess.length === 0) {
      console.log("No active reservations in state, fetching latest");
      try {
        reservationsToProcess = await fetchActiveReservations();
      } catch (error) {
        console.error("Error fetching reservations:", error);
      }
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
      
      // Check if it's a reservation for today
      if (reservation.date === today) {
        try {
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
        } catch (error) {
          console.error(`Error processing reservation ${reservation.id}:`, error);
          setConnectionError(true);
        }
      }
    }
    
    // If any updates were made, refresh the reservations
    if (updated) {
      try {
        await fetchActiveReservations();
      } catch (error) {
        console.error("Error refreshing reservations after update:", error);
      }
    }
  }, [
    activeReservations, 
    completedReservationIds, 
    updateRoomStatus, 
    markReservationAsCompleted, 
    fetchActiveReservations, 
    lastCheck, 
    compareTimeStrings, 
    user
  ]);

  // Setup frequent checks for reservation status changes
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up reservation status manager with user:", user.id);
    
    // Do initial fetch of active reservations
    fetchActiveReservations().catch(error => {
      console.error("Error in initial reservation fetch:", error);
    });
    
    // Process reservations immediately
    processReservations().catch(error => {
      console.error("Error in initial reservation processing:", error);
    });
    
    // Set up interval to check more frequently (every 10 seconds)
    const intervalId = setInterval(() => {
      console.log("Checking reservation statuses");
      processReservations().catch(error => {
        console.error("Error in reservation processing interval:", error);
      });
    }, 10000); // Check every 10 seconds for more responsive status updates
    
    // Set up realtime subscription to reservation changes
    try {
      const channel = supabase
        .channel('reservation-status-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations',
        }, () => {
          console.log("Reservation change detected, refreshing data");
          fetchActiveReservations().catch(error => {
            console.error("Error refreshing reservations after change:", error);
          });
          processReservations().catch(error => {
            console.error("Error processing reservations after change:", error);
          });
        })
        .subscribe((status) => {
          console.log("Reservation subscription status:", status);
        });
      
      return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
        
        // Cancel any pending requests
        abortControllersRef.current.forEach((controller) => {
          controller.abort();
        });
      };
    } catch (error) {
      console.error("Error setting up reservation status subscription:", error);
      
      // If subscription fails, rely on interval checks
      return () => {
        clearInterval(intervalId);
        
        // Cancel any pending requests
        abortControllersRef.current.forEach((controller) => {
          controller.abort();
        });
      };
    }
  }, [user, fetchActiveReservations, processReservations]);

  return {
    activeReservations,
    completedReservationIds,
    fetchActiveReservations,
    markReservationAsCompleted,
    updateRoomStatus,
    processReservations,
    connectionError
  };
}
