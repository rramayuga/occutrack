
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

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching rooms from database...");
      
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
        
        // Create a map of room IDs to their latest availability status and status
        const availabilityMap = new Map();
        if (availabilityData) {
          availabilityData.forEach(record => {
            if (!availabilityMap.has(record.room_id)) {
              availabilityMap.set(record.room_id, {
                isAvailable: record.is_available,
                // Since status may not be in the room_availability table yet, default to based on is_available
                status: record.status || (record.is_available ? 'available' : 'occupied')
              });
            }
          });
        }
        
        // Transform to Room format with availability and status from the map or database
        const roomsWithAvailability: Room[] = roomsData.map(room => {
          // Check if we have an availability record for this room
          const availabilityRecord = availabilityMap.get(room.id);
          
          // Always prioritize the status field from rooms table
          const status = room.status || 
                       (availabilityRecord && availabilityRecord.status) ||
                       (availabilityRecord && availabilityRecord.isAvailable ? 'available' : 'occupied');
          
          // Determine isAvailable based on status (only 'available' status means available)
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
  
  // Expose refetchRooms to allow manual refresh when needed
  const refetchRooms = useCallback(async () => {
    console.log("Manually refreshing rooms...");
    await fetchRooms();
  }, [fetchRooms]);
  
  // Use this to handle room availability toggling
  const handleToggleRoomAvailability = useCallback((roomId: string) => {
    console.log("Toggle availability for room:", roomId);
    const roomToToggle = rooms.find(room => room.id === roomId);
    if (roomToToggle) {
      toggleAvailability(roomToToggle, rooms, setRooms);
    } else {
      // If we can't find the room, just refresh all rooms
      refetchRooms();
    }
  }, [rooms, toggleAvailability, refetchRooms]);

  // This function is needed for the useRoomReservationCheck hook
  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      if (!user) return;
      
      // Determine the appropriate status
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
      
      // Also update the room status
      await supabase
        .from('rooms')
        .update({
          status: newStatus
        })
        .eq('id', roomId);
      
      // Update local state
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
