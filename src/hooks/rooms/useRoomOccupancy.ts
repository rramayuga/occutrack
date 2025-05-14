
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useRoomOccupancy = (roomId: string, isAvailable: boolean, occupiedBy?: string) => {
  const [currentOccupant, setCurrentOccupant] = useState<string | null>(occupiedBy || null);

  const fetchRoomOccupant = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      console.log(`[OCCUPANCY] Checking occupant for room ${roomId} at ${currentTime}`);
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          faculty_id,
          profiles:faculty_id (name)
        `)
        .eq('room_id', roomId)
        .eq('date', today)
        .lte('start_time', currentTime)
        .gt('end_time', currentTime)
        .limit(1);
      
      if (error) {
        console.error("[OCCUPANCY] Error fetching room occupant:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const newOccupant = data[0].profiles?.name || "Unknown Faculty";
        console.log(`[OCCUPANCY] Room ${roomId} is occupied by: ${newOccupant}`);
        setCurrentOccupant(newOccupant);
      } else if (!isAvailable && occupiedBy) {
        // If room is marked unavailable but no active reservation, use the provided occupiedBy
        console.log(`[OCCUPANCY] Room ${roomId} marked unavailable, using provided occupant: ${occupiedBy}`);
        setCurrentOccupant(occupiedBy);
      } else {
        console.log(`[OCCUPANCY] No current occupant for room ${roomId}, setting to null`);
        setCurrentOccupant(null);
      }
    } catch (error) {
      console.error("[OCCUPANCY] Error in fetchRoomOccupant:", error);
    }
  }, [roomId, isAvailable, occupiedBy]);

  useEffect(() => {
    // Always check occupant when component mounts or when isAvailable changes
    fetchRoomOccupant();
    
    // Setup timer to check every minute for accurate occupancy display
    const occupancyTimer = setInterval(() => {
      fetchRoomOccupant();
    }, 60000);
    
    // Setup a subscription to room_availability changes
    const availabilityChannel = supabase
      .channel('room-occupancy-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_availability',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log(`[OCCUPANCY] Room availability changed for ${roomId}, checking occupant`);
          fetchRoomOccupant();
        }
      )
      .subscribe();

    // Also subscribe to room status changes
    const statusChannel = supabase
      .channel('room-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        () => {
          console.log(`[OCCUPANCY] Room status changed for ${roomId}, checking occupant`);
          fetchRoomOccupant();
        }
      )
      .subscribe();
      
    // Also subscribe to reservation changes
    const reservationChannel = supabase
      .channel('room-reservation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_reservations',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log(`[OCCUPANCY] Reservation changed for room ${roomId}, checking occupant`);
          fetchRoomOccupant();
        }
      )
      .subscribe();

    return () => {
      clearInterval(occupancyTimer);
      supabase.removeChannel(availabilityChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(reservationChannel);
    };
  }, [roomId, isAvailable, fetchRoomOccupant]);

  return { currentOccupant };
};
