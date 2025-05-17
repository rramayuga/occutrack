
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { RoomStatus, Reservation } from '@/lib/types';

// Helper function to check if a time string is between start and end time
const isTimeBetween = (currentTime: string, startTime: string, endTime: string): boolean => {
  return currentTime >= startTime && currentTime <= endTime;
};

export function useReservationStatusManager() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const processingRef = useRef<Record<string, boolean>>({});
  const intervalIdRef = useRef<number | null>(null);
  const lastCheckTimeRef = useRef<string | null>(null);

  // Helper function to get current time in HH:MM format
  const getCurrentTime = useCallback((): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = useCallback((): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Fetch active reservations for today
  const fetchActiveReservations = useCallback(async () => {
    try {
      if (!user) return;
      
      console.log("Fetching active reservations for date:", getTodayDate());
      
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
          rooms:room_id (name, building_id),
          profiles:faculty_id (name),
          buildings:rooms(name)
        `)
        .eq('date', getTodayDate())
        .in('status', ['approved', 'active'])
        .order('start_time');
      
      if (error) {
        console.error("Error fetching active reservations:", error);
        return;
      }
      
      // Process the data into a more usable format
      const reservations = data.map(item => ({
        id: item.id,
        roomId: item.room_id,
        roomNumber: item.rooms?.name || "Unknown Room",
        building: item.buildings?.[0]?.name || "Unknown Building",
        date: item.date,
        startTime: item.start_time,
        endTime: item.end_time,
        purpose: item.purpose,
        status: item.status,
        faculty: item.profiles?.name || "Unknown Faculty"
      }));
      
      console.log("Found", reservations.length, "active reservations for today");
      setActiveReservations(reservations);
      return reservations;
    } catch (error) {
      console.error("Error in fetchActiveReservations:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, getTodayDate]);

  // Update room status in database
  const updateRoomStatus = useCallback(async (roomId: string, status: RoomStatus) => {
    try {
      console.log(`Updating room ${roomId} status to ${status}`);
      
      // Update room status in database - FIXED: Removed is_available field reference
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: status 
        })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        return false;
      }
      
      // Create availability record - important for tracking
      if (user) {
        await supabase
          .from('room_availability')
          .insert({
            room_id: roomId,
            is_available: status === 'available',
            status: status,
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
  const markReservationCompleted = useCallback(async (reservationId: string) => {
    try {
      console.log("Marking reservation", reservationId, "as completed");
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error marking reservation as completed:", error);
      return false;
    }
  }, []);

  // Process reservations and update room statuses accordingly
  const processReservations = useCallback(async (reservations: Reservation[] = activeReservations) => {
    if (reservations.length === 0) {
      console.log("No reservations to process");
      return;
    }
    
    const currentTime = getCurrentTime();
    console.log("Processing", reservations.length, "reservations at", currentTime);
    
    for (const reservation of reservations) {
      // Skip if already processing this reservation
      if (processingRef.current[reservation.id]) continue;
      
      try {
        processingRef.current[reservation.id] = true;
        
        // If current time is between start and end time and reservation is approved
        if (isTimeBetween(currentTime, reservation.startTime, reservation.endTime) && 
            reservation.status === 'approved') {
          console.log("START TIME REACHED for reservation", reservation.id, "- setting room as occupied");
          
          // Update room status to occupied
          console.log("Updating room", reservation.roomId, "status to occupied");
          await updateRoomStatus(reservation.roomId, 'occupied');
          
          // Update reservation status to active
          await supabase
            .from('room_reservations')
            .update({ status: 'active' })
            .eq('id', reservation.id);
        }
        
        // If current time is past end time and reservation is active
        else if (currentTime > reservation.endTime && 
                (reservation.status === 'active' || reservation.status === 'approved')) {
          console.log("END TIME REACHED for reservation", reservation.id, "- completing reservation and marking room available");
          
          // Update room status to available
          console.log("Updating room", reservation.roomId, "status to available");
          await updateRoomStatus(reservation.roomId, 'available');
          
          // Mark reservation as completed
          await markReservationCompleted(reservation.id);
        }
      } catch (error) {
        console.error("Error processing reservation", reservation.id, ":", error);
      } finally {
        processingRef.current[reservation.id] = false;
      }
    }
  }, [activeReservations, getCurrentTime, updateRoomStatus, markReservationCompleted]);

  // Set up interval to check reservations
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up reservation status manager with user:", user.id);
    
    const fetchAndProcessReservations = async () => {
      try {
        // Only fetch if we don't have any active reservations
        let reservations = activeReservations;
        if (reservations.length === 0) {
          console.log("No active reservations in state, fetching latest");
          reservations = await fetchActiveReservations() || [];
        }
        
        // Process reservations
        await processReservations(reservations);
      } catch (error) {
        console.error("Error in fetchAndProcessReservations:", error);
      }
    };
    
    // Run immediately on mount
    fetchAndProcessReservations();
    
    // Set up interval to check every 30 seconds
    if (intervalIdRef.current === null) {
      intervalIdRef.current = window.setInterval(fetchAndProcessReservations, 30000);
      console.log("Set up interval check every 30 seconds");
    }
    
    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.log("Cleared reservation check interval");
      }
    };
  }, [user, fetchActiveReservations, processReservations]);

  // Set up subscription for real-time updates
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up real-time subscription for room reservations");
    
    // Subscribe to room_reservations changes
    const reservationChannel = supabase
      .channel('room_reservations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations' 
      }, (payload) => {
        console.log("Room reservation change detected:", payload.eventType);
        fetchActiveReservations();
      })
      .subscribe((status) => {
        console.log("Reservation subscription status:", status);
      });

    // Subscribe to room status changes
    const roomChannel = supabase
      .channel('room_status_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log("Room status change detected:", payload);
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
    
    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [user, fetchActiveReservations]);

  return {
    activeReservations,
    isLoading,
    refreshReservations: fetchActiveReservations
  };
}
