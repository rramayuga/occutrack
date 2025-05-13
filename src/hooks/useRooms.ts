
// If this hook doesn't already exist, I'm creating a new one
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BuildingWithFloors, Room } from '@/lib/types';

export const useRooms = () => {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const buildingsWithFloors: BuildingWithFloors[] = buildingsData ? buildingsData.map(building => ({
        id: building.id,
        name: building.name,
        floors: building.floors,
        location: building.location || '',
        utilization: building.utilization || '',
        floorRooms: {}
      })) : [];
      
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
      
      // Organize rooms by floor for each building
      roomsWithAvailability.forEach(room => {
        const buildingIndex = buildingsWithFloors.findIndex(b => b.id === room.buildingId);
        if (buildingIndex >= 0) {
          if (!buildingsWithFloors[buildingIndex].floorRooms[room.floor]) {
            buildingsWithFloors[buildingIndex].floorRooms[room.floor] = [];
          }
          buildingsWithFloors[buildingIndex].floorRooms[room.floor].push(room);
        }
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

  return { buildings, rooms, isLoading, refreshRooms };
};
