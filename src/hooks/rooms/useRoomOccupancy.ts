
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useRoomOccupancy = (roomId: string, isAvailable: boolean, occupiedBy?: string) => {
  const [currentOccupant, setCurrentOccupant] = useState<string | null>(null);

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
    }
  }, [roomId, isAvailable]);

  return { currentOccupant };
};
