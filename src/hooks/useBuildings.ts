
import { useState, useEffect } from 'react';
import { BuildingWithFloors } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useBuildings() {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      
      // Fetch buildings from Supabase
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      
      if (buildingsError) {
        throw buildingsError;
      }
      
      if (buildingsData && buildingsData.length > 0) {
        // Get room counts from supabase
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('building_id');
          
        if (roomsError) {
          console.error("Error fetching room counts:", roomsError);
        }
        
        // Calculate room counts per building
        const roomCounts: {[key: string]: number} = {};
        if (roomsData) {
          roomsData.forEach(room => {
            roomCounts[room.building_id] = (roomCounts[room.building_id] || 0) + 1;
          });
        }
        
        // Transform to BuildingWithFloors format with room counts
        const buildingsWithFloors: BuildingWithFloors[] = buildingsData.map(building => ({
          id: building.id,
          name: building.name,
          floors: Array.from({ length: building.floors }, (_, i) => i + 1),
          roomCount: roomCounts[building.id] || 0,
          utilization: building.utilization || '0%', // Add utilization property with default
          location: building.location
        }));
        
        console.log("Fetched buildings:", buildingsWithFloors);
        setBuildings(buildingsWithFloors);
        
        if (buildingsWithFloors.length > 0 && !selectedBuilding) {
          setSelectedBuilding(buildingsWithFloors[0].id);
        }
      } else {
        console.log("No buildings found in Supabase");
        setBuildings([]);
      }
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

  // Add the missing addBuilding function
  const addBuilding = async (name: string, floorCount: number, location?: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to add a building.",
          variant: "destructive"
        });
        return false;
      }

      const newBuilding = {
        name,
        floors: floorCount,
        location: location || null,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('buildings')
        .insert(newBuilding)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Building added",
        description: `The building "${name}" has been successfully added.`
      });
      
      // Refresh buildings list
      await fetchBuildings();
      
      return true;
    } catch (error) {
      console.error("Error adding building:", error);
      toast({
        title: "Error adding building",
        description: "Could not add the building to the database.",
        variant: "destructive"
      });
      return false;
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
    fetchBuildings();
    
    // Set up real-time subscription
    const unsubscribe = setupBuildingSubscription();
    
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    buildings,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    fetchBuildings,
    addBuilding
  };
}
