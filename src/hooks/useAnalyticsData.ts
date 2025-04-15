
import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoomUsageData } from '@/components/admin/types/room';

export const useAnalyticsData = (
  startDate: Date,
  endDate: Date,
  selectedBuilding: string,
  selectedFloor: string,
  statusFilter: string
) => {
  const [roomUsageData, setRoomUsageData] = useState<RoomUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoomUsageData = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const { data: reservationData, error: reservationError } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          rooms (
            id,
            name,
            type,
            status,
            floor,
            building_id,
            buildings (
              name
            )
          )
        `)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);

      if (reservationError) throw reservationError;

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          type,
          status,
          floor,
          building_id,
          buildings (
            name
          )
        `);

      if (roomsError) throw roomsError;

      const roomUsageMap = new Map<string, RoomUsageData>();
      
      roomsData.forEach((room: any) => {
        roomUsageMap.set(room.id, {
          roomName: room.name,
          reservations: 0,
          utilizationHours: 0,
          status: room.status || 'available',
          buildingName: room.buildings?.name || 'Unknown',
          floor: room.floor
        });
      });

      reservationData.forEach((reservation: any) => {
        const roomId = reservation.room_id;
        const roomData = roomUsageMap.get(roomId);
        
        if (roomData) {
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
            
            roomUsageMap.set(roomId, {
              ...roomData,
              reservations: roomData.reservations + 1,
              utilizationHours: roomData.utilizationHours + durationHours
            });
          }
        }
      });

      let roomUsageArray = Array.from(roomUsageMap.values())
        .filter(room => {
          const buildingMatch = selectedBuilding === "all" || room.buildingName === selectedBuilding;
          const floorMatch = selectedFloor === "all" || room.floor === parseInt(selectedFloor);
          const statusMatch = statusFilter === "all" || room.status === statusFilter;
          return buildingMatch && floorMatch && statusMatch;
        })
        .sort((a, b) => {
          const aNum = parseInt(a.roomName.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.roomName.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });

      setRoomUsageData(roomUsageArray);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching room usage data:", error);
      toast({
        title: "Error",
        description: "Failed to load room usage data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomUsageData();
    
    const channel = supabase
      .channel('room-reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_reservations'
        },
        () => {
          fetchRoomUsageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate, selectedBuilding, selectedFloor, statusFilter]);

  return { roomUsageData, isLoading };
};
