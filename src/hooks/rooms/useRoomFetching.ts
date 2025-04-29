
import { useState, useCallback, useRef } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for fetching room data from the database
 */
export function useRoomFetching() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchInProgress = useRef(false);
  
  const fetchRooms = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }
    
    try {
      fetchInProgress.current = true;
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
              // Use type assertion with a fallback for missing status property
              const status = (record as any).status as RoomStatus || 
                            (record.is_available ? 'available' as RoomStatus : 'occupied' as RoomStatus);
              
              const availStatus = {
                isAvailable: record.is_available,
                status: status
              };
              
              availabilityMap.set(record.room_id, availStatus);
            }
          });
        }
        
        const roomsWithAvailability: Room[] = roomsData.map(room => {
          const availabilityRecord = availabilityMap.get(room.id);
          
          // Always prioritize maintenance status from rooms table
          let status: RoomStatus;
          
          if (room.status === 'maintenance') {
            // Maintenance status should always take precedence
            status = 'maintenance';
          } else if (availabilityRecord?.status) {
            // If not maintenance, check availability record status
            status = availabilityRecord.status;
          } else if (availabilityRecord?.isAvailable !== undefined) {
            // Fall back to boolean availability if no explicit status
            status = availabilityRecord.isAvailable ? 'available' : 'occupied';
          } else {
            // Default case if no availability info exists
            status = room.status || 'available';
          }
          
          const isAvailable = status === 'available';
          
          return {
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            isAvailable: isAvailable,
            floor: room.floor,
            buildingId: room.building_id,
            status: status
          };
        });
        
        console.log("Fetched rooms:", roomsWithAvailability.length);
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
      fetchInProgress.current = false;
    }
  }, [toast]);
  
  // Use a debounce mechanism for refetching to prevent excessive calls
  const refetchRooms = useCallback(async () => {
    console.log("Manually refreshing rooms...");
    await fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    setRooms,
    loading,
    fetchRooms,
    refetchRooms
  };
}
