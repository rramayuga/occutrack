
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BuildingWithFloors, Room, Floor } from '@/lib/types';

export interface FloorRoomsMap {
  [floorNumber: number]: Room[];
}

export const useRooms = () => {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching rooms and buildings data...');
      
      // Fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true });
      
      if (buildingsError) throw buildingsError;
      
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) throw roomsError;
      
      // Get availability data
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('room_availability')
        .select('*');
      
      if (availabilityError) throw availabilityError;
      
      // Transform and set data
      const buildingsWithFloors: BuildingWithFloors[] = buildingsData ? buildingsData.map(building => {
        // Create floor objects for each floor
        const floorArray: Floor[] = [];
        for (let i = 1; i <= building.floors; i++) {
          floorArray.push({
            id: `${building.id}-floor-${i}`,
            number: i,
            name: `Floor ${i}`
          });
        }
        
        return {
          id: building.id,
          name: building.name,
          floors: floorArray,
          location: building.location || '',
          utilization: building.utilization || '',
          roomCount: 0, // Will be calculated below
          createdAt: building.created_at,
          updatedAt: building.created_at // Using created_at as fallback
        };
      }) : [];
      
      const roomsWithAvailability: Room[] = roomsData ? roomsData.map(room => {
        const availability = availabilityData?.find(a => a.room_id === room.id);
        
        return {
          id: room.id,
          name: room.name,
          floor: room.floor,
          capacity: room.capacity,
          buildingId: room.building_id,
          type: room.type,
          status: room.status || 'available',
          isAvailable: availability ? availability.is_available : true
        };
      }) : [];
      
      // Count rooms per building
      buildingsWithFloors.forEach(building => {
        building.roomCount = roomsWithAvailability.filter(room => room.buildingId === building.id).length;
      });
      
      console.log('Rooms and buildings data fetched successfully');
      setBuildings(buildingsWithFloors);
      setRooms(roomsWithAvailability);
    } catch (error) {
      console.error('Error fetching rooms and buildings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to toggle room availability
  const handleToggleRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('room_availability')
        .upsert({
          room_id: roomId,
          is_available: isAvailable,
          updated_by: (await supabase.auth.getUser()).data.user?.id || '',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Update local state
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { ...room, isAvailable } : room
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating room availability:', error);
      return false;
    }
  }, []);

  // Function to refresh data
  const refreshRooms = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  // Initial data loading
  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription
    const roomsSubscription = supabase
      .channel('rooms-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'rooms' }, 
          () => fetchData())
      .subscribe();
      
    const availabilitySubscription = supabase
      .channel('availability-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'room_availability' }, 
          () => fetchData())
      .subscribe();
          
    return () => {
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(availabilitySubscription);
    };
  }, [fetchData]);

  return { 
    buildings, 
    rooms, 
    isLoading, 
    refreshRooms, 
    selectedBuilding, 
    setSelectedBuilding,
    handleToggleRoomAvailability
  };
};
