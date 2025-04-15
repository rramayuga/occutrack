
import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useRoomUtilization = () => {
  const [utilizationRate, setUtilizationRate] = useState("0%");

  const calculateUtilizationRate = useCallback(async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('status');
        
      if (roomsError) throw roomsError;
      
      if (roomsData) {
        const totalRooms = roomsData.length;
        const occupiedRooms = roomsData.filter(room => 
          room.status === 'occupied'
        ).length;
        
        const rate = totalRooms > 0 
          ? Math.round((occupiedRooms / totalRooms) * 100)
          : 0;
          
        setUtilizationRate(`${rate}%`);
      }
    } catch (error) {
      console.error('Error calculating utilization rate:', error);
    }
  }, []);

  useEffect(() => {
    calculateUtilizationRate();
    
    const channel = supabase
      .channel('room-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        () => {
          calculateUtilizationRate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calculateUtilizationRate]);

  return utilizationRate;
};
