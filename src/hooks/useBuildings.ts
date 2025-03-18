
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
        // Transform to BuildingWithFloors format
        const buildingsWithFloors: BuildingWithFloors[] = buildingsData.map(building => ({
          id: building.id,
          name: building.name,
          floors: Array.from({ length: building.floors }, (_, i) => i + 1),
          roomCount: 0 // This will be updated after fetching rooms
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
    fetchBuildings
  };
}
