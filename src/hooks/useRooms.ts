import { useState, useEffect, useCallback } from 'react';
import { BuildingWithFloors, Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useBuildings } from './useBuildings';
import { useRoomAvailability } from './useRoomAvailability';
import { useRoomReservationCheck } from './useRoomReservationCheck';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    buildings, 
    selectedBuilding, 
    setSelectedBuilding,
    fetchBuildings 
  } = useBuildings();
  
  const { 
    handleToggleRoomAvailability: toggleAvailability,
    setupRoomAvailabilitySubscription 
  } = useRoomAvailability();

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching rooms from database...");
      
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) {
        throw roomsError;
      }
      
      if (roomsData) {
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('room_availability')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (availabilityError) {
          console.error("Error fetching room availability:", availabilityError);
        }
        
        const availabilityMap = new Map();
        if (availabilityData) {
          availabilityData.forEach(record => {
            if (!availabilityMap.has(record.room_id)) {
              const availStatus = {
                isAvailable: record.is_available,
                status: (record as any).status as RoomStatus || 
                       (record.is_available ? 'available' as RoomStatus : 'occupied' as RoomStatus)
              };
              
              availabilityMap.set(record.room_id, availStatus);
            }
          });
        }
        
        const roomsWithAvailability: Room[] = roomsData.map(room => {
          const availabilityRecord = availabilityMap.get(room.id);
          
          const status = room.status || 
                       (availabilityRecord && availabilityRecord.status) ||
                       (availabilityRecord && availabilityRecord.isAvailable ? 'available' : 'occupied');
          
          const isAvailable = status === 'available';
          
          return {
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            isAvailable: isAvailable,
            floor: room.floor,
            buildingId: room.building_id,
            status: status as RoomStatus
          };
        });
        
        console.log("Fetched rooms:", roomsWithAvailability);
        setRooms(roomsWithAvailability);
      } else {
        console.log("No rooms found in Supabase");
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error loading rooms",
        description: "Could not load rooms data from server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const refetchRooms = useCallback(async () => {
    console.log("Manually refreshing rooms...");
    await fetchRooms();
  }, [fetchRooms]);
  
  const handleToggleRoomAvailability = useCallback((roomId: string) => {
    console.log("Toggle availability for room:", roomId);
    const roomToToggle = rooms.find(room => room.id === roomId);
    if (roomToToggle) {
      toggleAvailability(roomToToggle, rooms, setRooms);
    } else {
      refetchRooms();
    }
  }, [rooms, toggleAvailability, refetchRooms]);

  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      if (!user) return;
      
      const newStatus: RoomStatus = isAvailable ? 'available' : 'occupied';
      
      await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: isAvailable,
          status: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      await supabase
        .from('rooms')
        .update({
          status: newStatus
        })
        .eq('id', roomId);
      
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { 
            ...room, 
            isAvailable,
            status: newStatus
          } : room
        )
      );
    } catch (error) {
      console.error("Error updating room availability:", error);
    }
  }, [user]);

  const setupRoomSubscription = () => {
    const roomChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  };

  useRoomReservationCheck(rooms, updateRoomAvailability);

  useEffect(() => {
    const fetchData = async () => {
      await fetchRooms();
    };
    
    fetchData();
    
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription(fetchRooms);
    
    return () => {
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, [fetchRooms]);

  return {
    buildings,
    rooms,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    handleToggleRoomAvailability,
    refetchRooms
  };
}
