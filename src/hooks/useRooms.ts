import { useState, useEffect, useCallback } from 'react';
import { BuildingWithFloors, Room } from '@/lib/types';
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
  
  // Use our expanded useBuildings hook with all its properties
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

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // Fetch rooms from Supabase
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) {
        throw roomsError;
      }
      
      if (roomsData) {
        // Get the latest availability status for each room
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('room_availability')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (availabilityError) {
          console.error("Error fetching room availability:", availabilityError);
        }
        
        // Create a map of room IDs to their latest availability status
        const availabilityMap = new Map();
        if (availabilityData) {
          availabilityData.forEach(record => {
            if (!availabilityMap.has(record.room_id)) {
              availabilityMap.set(record.room_id, record.is_available);
            }
          });
        }
        
        // Transform to Room format with availability from the map or default to true
        const roomsWithAvailability: Room[] = roomsData.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          isAvailable: availabilityMap.has(room.id) ? availabilityMap.get(room.id) : true,
          floor: room.floor,
          buildingId: room.building_id,
          status: room.status || (availabilityMap.has(room.id) ? (availabilityMap.get(room.id) ? 'available' : 'occupied') : 'available')
        }));
        
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
  };
  
  // Expose refetchRooms to allow manual refresh when needed
  const refetchRooms = useCallback(async () => {
    await fetchRooms();
  }, []);
  
  // Use this to handle room availability toggling
  const handleToggleRoomAvailability = (roomId: string) => {
    const roomToToggle = rooms.find(room => room.id === roomId);
    if (roomToToggle) {
      toggleAvailability(roomToToggle, rooms, setRooms);
    }
  };

  // This function is needed for the useRoomReservationCheck hook
  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      if (!user) return;
      
      await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: isAvailable,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      // Update local state
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { ...room, isAvailable } : room
        )
      );
    } catch (error) {
      console.error("Error updating room availability:", error);
    }
  }, [user]);

  // Setup room subscription
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

  // Use our room reservation check hook
  useRoomReservationCheck(rooms, updateRoomAvailability);

  useEffect(() => {
    const fetchData = async () => {
      await fetchRooms();
    };
    
    fetchData();
    
    // Set up real-time subscriptions
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription(fetchRooms);
    
    return () => {
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, []);

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
