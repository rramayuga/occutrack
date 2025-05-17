
import { useState, useEffect, useCallback } from 'react';
import { Reservation, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";

export function useReservationStatusManager() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [completedReservationIds, setCompletedReservationIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages

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

  // Format current time as HH:MM for consistent comparison
  const getCurrentTimeString = useCallback(() => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + 
           now.getMinutes().toString().padStart(2, '0');
  }, []);

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
        .neq('status', 'completed')
        .order('start_time');
      
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

  // Update room status based on reservation time
  const updateRoomStatus = useCallback(async (roomId: string, isOccupied: boolean) => {
    try {
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'}`);
      
      if (!roomId) {
        console.error("Cannot update room status: Missing roomId");
        return false;
      }
      
      // Get current room status to check if it's under maintenance
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status, name')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error("Error fetching room status:", roomError);
        return false;
      }
      
      // Don't update rooms under maintenance
      if (roomData.status === 'maintenance') {
        console.log(`Room ${roomData.name} is under maintenance, skipping status update`);
        return false;
      }
      
      // Update room status in database
      const newStatus: RoomStatus = isOccupied ? 'occupied' : 'available';
      
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: newStatus,
          is_available: !isOccupied 
        })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        return false;
      }
      
      console.log(`Successfully updated room ${roomId} to status: ${newStatus}`);
      
      // Create availability record - this is important for analytics tracking
      if (user) {
        await supabase
          .from('room_availability')
          .insert({
            room_id: roomId,
            is_available: !isOccupied,
            status: newStatus,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating room status:", error);
      return false;
    }
  }, [user]);

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
        return false;
      }
      
      setCompletedReservationIds(prev => [...prev, reservationId]);
      return true;
    } catch (error) {
      console.error("Error in markReservationAsCompleted:", error);
      return false;
    }
  }, []);

  // Process active reservations to check for status changes
  const processReservations = useCallback(async () => {
    if (!user) {
      console.log("No user logged in, skipping reservation processing");
      return;
    }
    
    // Prevent concurrent processing
    if (isProcessing) {
      console.log("Reservation processing already in progress, skipping");
      return;
    }
    
    setIsProcessing(true);
    
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
      
      const currentTime = getCurrentTimeString();
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
    } catch (error) {
      console.error("Error in processReservations:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    activeReservations, 
    completedReservationIds, 
    updateRoomStatus, 
    markReservationAsCompleted, 
    fetchActiveReservations, 
    lastCheck, 
    compareTimeStrings, 
    user,
    getCurrentTimeString,
    isProcessing
  ]);

  // Setup frequent checks for reservation status changes
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up reservation status manager with user:", user.id);
    
    // Do initial fetch of active reservations
    fetchActiveReservations();
    
    // Process reservations immediately
    processReservations();
    
    // Set up interval to check more frequently
    const intervalId = setInterval(() => {
      console.log("Checking reservation statuses");
      processReservations();
    }, 5000); // Check every 5 seconds
    
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
          fetchActiveReservations().then(() => processReservations());
        })
        .subscribe((status) => {
          console.log("Reservation subscription status:", status);
        });
      
      return () => {
        clearInterval(intervalId);
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error setting up reservation status subscription:", error);
      
      // If subscription fails, rely on interval checks
      return () => clearInterval(intervalId);
    }
  }, [user, fetchActiveReservations, processReservations]);

  // THIS SECTION HAS BEEN REMOVED - It was attempting to call an invalid RPC function
  // The following code tried to enable realtime but caused a TypeScript error:
  // useEffect(() => {
  //   const enableRealtimeForTables = async () => {
  //     try {
  //       await supabase.rpc('supabase_realtime', { enable_realtime: true });
  //     } catch (error) {
  //       console.log("Note: Failed to enable realtime for tables, will continue with default configuration");
  //     }
  //   };
  //   
  //   enableRealtimeForTables();
  // }, []);

  return {
    activeReservations,
    completedReservationIds,
    fetchActiveReservations,
    markReservationAsCompleted,
    updateRoomStatus,
    processReservations
  };
}
