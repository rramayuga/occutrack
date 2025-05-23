import { useState, useEffect, useCallback, useMemo } from 'react';
import { BuildingWithFloors, Building } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useBuildings = () => {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const { toast } = useToast();

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true);
      
      // First fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name');
      
      if (buildingsError) throw buildingsError;
      
      // Then fetch rooms to count them per building
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, building_id');
        
      if (roomsError) throw roomsError;
      
      // Transform buildings and add room counts
      const processedBuildings: BuildingWithFloors[] = buildingsData.map((building: any) => {
        // Count rooms for this building
        const buildingRooms = roomsData.filter((room: any) => room.building_id === building.id);
        
        return {
          id: building.id,
          name: building.name,
          location: building.location || '',
          floors: Array.from({ length: building.floors || 1 }, (_, i) => ({
            id: `${building.id}-floor-${i + 1}`,
            number: i + 1,
            name: `Floor ${i + 1}`
          })),
          roomCount: buildingRooms.length,
          utilization: building.utilization || '0%'
        };
      });
      
      setBuildings(processedBuildings);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load buildings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBuildings();
    
    // Set up a subscription for real-time updates
    const buildingsChannel = supabase
      .channel('buildings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'buildings' 
      }, () => {
        console.log('Buildings table changed, fetching updated data');
        fetchBuildings();
      })
      .subscribe();
      
    const roomsChannel = supabase
      .channel('rooms_for_buildings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, () => {
        console.log('Rooms table changed, updating buildings data');
        fetchBuildings();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(buildingsChannel);
      supabase.removeChannel(roomsChannel);
    };
  }, [fetchBuildings]);

  const addBuilding = async (name: string, floorCount: number, location?: string) => {
    try {
      // Fix type error by getting user ID first before inserting
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      const { data, error } = await supabase
        .from('buildings')
        .insert([
          { 
            name, 
            floors: floorCount,
            location: location || null,
            created_by: userId || null
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Building Added',
        description: `${name} has been added successfully`,
      });
      
      // Refresh buildings data after adding
      fetchBuildings();
      
      return true;
    } catch (error) {
      console.error('Error adding building:', error);
      toast({
        title: 'Error',
        description: 'Failed to add building',
        variant: 'destructive',
      });
      return false;
    }
  };

  const editBuilding = async (id: string, name: string, location?: string) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .update({ 
          name,
          location: location || null
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh buildings data after editing
      fetchBuildings();
      
      return true;
    } catch (error) {
      console.error('Error updating building:', error);
      toast({
        title: 'Error',
        description: 'Failed to update building',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Fix this function to correctly update floor count
  const updateBuilding = async (id: string, name: string, floorCount: number, location?: string) => {
    try {
      console.log(`Updating building ${id}: name=${name}, floors=${floorCount}, location=${location}`);
      
      const { error } = await supabase
        .from('buildings')
        .update({ 
          name,
          floors: floorCount,
          location: location || null
        })
        .eq('id', id);
      
      if (error) {
        console.error('Database error when updating building:', error);
        throw error;
      }
      
      toast({
        title: 'Building Updated',
        description: `${name} has been updated successfully`,
      });
      
      // Refresh buildings data after updating
      fetchBuildings();
      
      return true;
    } catch (error) {
      console.error('Error updating building:', error);
      toast({
        title: 'Error',
        description: 'Failed to update building',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteBuilding = async (id: string) => {
    try {
      // First check if building has rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .eq('building_id', id);
        
      if (roomsError) throw roomsError;
      
      if (rooms && rooms.length > 0) {
        toast({
          title: 'Cannot Delete Building',
          description: 'Please remove all rooms from this building first',
          variant: 'destructive',
        });
        return false;
      }
      
      // If no rooms, proceed with deletion
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh buildings data after deletion
      fetchBuildings();
      
      return true;
    } catch (error) {
      console.error('Error deleting building:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete building',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add a new computed property to convert BuildingWithFloors[] to Building[]
  const simplifiedBuildings = useMemo((): Building[] => {
    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      location: building.location,
      floors: building.floors.length, // Convert floors array to number count
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
      roomCount: building.roomCount,
      utilization: building.utilization
    }));
  }, [buildings]);

  // Return the additional properties needed by other components
  return { 
    buildings, 
    simplifiedBuildings, // Add this new property for components expecting Building[]
    loading, 
    selectedBuilding,
    setSelectedBuilding,
    fetchBuildings,
    addBuilding, 
    editBuilding,
    updateBuilding,
    deleteBuilding 
  };
};
