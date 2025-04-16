
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useRoomOccupancy = (roomId: string, isAvailable: boolean, occupiedBy?: string) => {
  const [currentOccupant, setCurrentOccupant] = useState<string | null>(occupiedBy || null);

  const fetchRoomOccupant = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          faculty_id,
          profiles:faculty_id (name)
        `)
        .eq('room_id', roomId)
        .eq('date', today)
        .lt('start_time', currentTime)
        .gt('end_time', currentTime)
        .limit(1);
      
      if (error) {
        console.error("Error fetching room occupant:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setCurrentOccupant(data[0].profiles?.name || "Unknown Faculty");
      } else {
        setCurrentOccupant(occupiedBy || null);
      }
    } catch (error) {
      console.error("Error in fetchRoomOccupant:", error);
    }
  };

  useEffect(() => {
    if (!isAvailable) {
      fetchRoomOccupant();
    } else {
      // If the room becomes available, clear the occupant
      setCurrentOccupant(null);
    }
  }, [roomId, isAvailable]);

  // Setup a subscription to room_availability changes to update the occupant in real-time
  useEffect(() => {
    const channel = supabase
      .channel('room-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_availability',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchRoomOccupant();
        }
      )
      .subscribe();

    // Also subscribe to room status changes
    const statusChannel = supabase
      .channel('room-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        () => {
          fetchRoomOccupant();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [roomId]);

  return { currentOccupant };
};
