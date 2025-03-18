
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

interface Building {
  id: string;
  name: string;
  floors: number;
  roomCount: number;
  utilization: string;
  createdBy: string;
}

export function useBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBuildings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, get all buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      
      if (buildingsError) throw buildingsError;
      
      if (!buildingsData || buildingsData.length === 0) {
        setBuildings([]);
        return;
      }
      
      // For admin, filter to show only buildings they created
      let filteredBuildings = buildingsData;
      if (user.role === 'admin') {
        filteredBuildings = buildingsData.filter(building => 
          building.created_by === user.id
        );
      }
      
      // Get room counts for each building
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('building_id, id');
      
      if (roomsError) throw roomsError;
      
      // Calculate room counts
      const roomCounts: Record<string, number> = {};
      if (roomsData) {
        roomsData.forEach(room => {
          const buildingId = room.building_id;
          roomCounts[buildingId] = (roomCounts[buildingId] || 0) + 1;
        });
      }
      
      // Transform buildings data
      const transformedBuildings = filteredBuildings.map(building => ({
        id: building.id,
        name: building.name,
        floors: building.floors,
        roomCount: roomCounts[building.id] || 0,
        utilization: '0%', // This could be calculated based on room reservations
        createdBy: building.created_by || ''
      }));
      
      setBuildings(transformedBuildings);
      console.log("Fetched buildings for admin:", transformedBuildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast({
        title: "Error loading buildings",
        description: "Could not load buildings data from server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addBuilding = async (name: string, floorCount: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add a building.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const newBuilding = {
        name,
        floors: floorCount,
        created_by: user.id
      };
      
      const { data, error } = await supabase
        .from('buildings')
        .insert(newBuilding)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast({
          title: "Building added",
          description: `${name} has been added successfully.`
        });
        
        // Refresh buildings
        fetchBuildings();
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error adding building:", error);
      toast({
        title: "Error",
        description: "Failed to add building.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Setup real-time subscription for building updates
  const setupBuildingSubscription = () => {
    const buildingChannel = supabase
      .channel('public:buildings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'buildings' 
      }, (payload) => {
        console.log('Building change received:', payload);
        fetchBuildings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(buildingChannel);
    };
  };

  useEffect(() => {
    if (user) {
      fetchBuildings();
      
      const unsubscribe = setupBuildingSubscription();
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  return {
    buildings,
    loading,
    fetchBuildings,
    addBuilding
  };
}
