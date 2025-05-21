
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
  const fetchTimeoutId = useRef<number | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  
  const fetchRooms = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }
    
    // Clear any pending fetch timeout
    if (fetchTimeoutId.current !== null) {
      window.clearTimeout(fetchTimeoutId.current);
      fetchTimeoutId.current = null;
    }
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      console.log("Fetching rooms from database...");
      
      // Get all rooms data - important to fetch this first for the most accurate status
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        throw roomsError;
      }
      
      if (!roomsData) {
        console.log("No rooms found in database");
        setRooms([]);
        return;
      }
      
      console.log("Fetched room data:", roomsData.length, "rooms");
      
      // Now get the availability data
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('room_availability')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (availabilityError) {
        console.error("Error fetching room availability:", availabilityError);
        // Continue without availability data instead of failing completely
      }
      
      // Create a map for quick lookup of the most recent availability record for each room
      const availabilityMap = new Map();
      if (availabilityData) {
        for (const record of availabilityData) {
          if (!availabilityMap.has(record.room_id)) {
            // Handle case where status might not exist in older records
            let status: RoomStatus = 'available';
            
            if ('status' in record && record.status) {
              // If status exists in the record, use it
              status = record.status as RoomStatus;
            } else {
              // Otherwise derive it from is_available
              status = record.is_available ? 'available' : 'occupied';
            }
            
            availabilityMap.set(record.room_id, {
              isAvailable: record.is_available,
              status: status
            });
          }
        }
      }
      
      // Process room data with availability information
      const roomsWithAvailability: Room[] = roomsData.map(room => {
        const availabilityRecord = availabilityMap.get(room.id);
        
        // Determine the correct status - database room status takes precedence
        let status: RoomStatus;
        let isAvailable: boolean;
        
        // Room status from the rooms table is the source of truth
        if (room.status) {
          status = room.status as RoomStatus;
          // Only "available" status is considered available
          isAvailable = status === 'available';
        } else if (availabilityRecord?.status) {
          // If no explicit room status, use the availability record status
          status = availabilityRecord.status;
          isAvailable = status === 'available';
        } else if (availabilityRecord?.isAvailable !== undefined) {
          // Fall back to boolean availability if no explicit status
          isAvailable = availabilityRecord.isAvailable;
          status = isAvailable ? 'available' : 'occupied';
        } else {
          // Default case if no availability info exists
          status = 'available';
          isAvailable = true;
        }
        
        return {
          id: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity || 30,
          isAvailable: isAvailable,
          floor: room.floor,
          buildingId: room.building_id,
          status: status
        };
      });
      
      console.log("Fetched rooms:", roomsWithAvailability.length);
      console.log("Room statuses:", roomsWithAvailability.map(r => `${r.name}: ${r.status}`).join(', '));
      
      setRooms(roomsWithAvailability);
      retryCount.current = 0; // Reset retry count on success
    } catch (error) {
      console.error("Error fetching rooms:", error);
      
      // Implement retry logic
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        const delay = 1000 * Math.pow(2, retryCount.current); // Exponential backoff
        
        console.log(`Retrying room fetch (${retryCount.current}/${MAX_RETRIES}) after ${delay}ms`);
        
        fetchTimeoutId.current = window.setTimeout(() => {
          fetchRooms();
        }, delay) as unknown as number;
      } else {
        toast({
          title: "Error loading rooms",
          description: "Could not load rooms data from server. Please try refreshing.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [toast]);
  
  // Use a debounce mechanism for refetching to prevent excessive calls
  const refetchRooms = useCallback(async () => {
    console.log("Manually refreshing rooms...");
    
    // Clear any pending timeout
    if (fetchTimeoutId.current !== null) {
      window.clearTimeout(fetchTimeoutId.current);
    }
    
    // Reset retry count for manual refreshes
    retryCount.current = 0;
    
    // Set a timeout to debounce multiple rapid calls
    fetchTimeoutId.current = window.setTimeout(() => {
      fetchRooms();
      fetchTimeoutId.current = null;
    }, 300) as unknown as number;
  }, [fetchRooms]);

  return {
    rooms,
    setRooms,
    loading,
    fetchRooms,
    refetchRooms
  };
}
