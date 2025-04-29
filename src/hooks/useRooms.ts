
import { useState, useEffect, useCallback, useRef } from 'react';
import { BuildingWithFloors, Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
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
  const fetchInProgress = useRef(false);
  
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
          
          // FIXED: Always prioritize maintenance status from rooms table
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
  
  const handleToggleRoomAvailability = useCallback((roomId: string) => {
    console.log("Toggle availability for room:", roomId);
    const roomToToggle = rooms.find(room => room.id === roomId);
    
    // FIXED: Block toggling availability for maintenance rooms
    if (roomToToggle && roomToToggle.status === 'maintenance') {
      toast({
        title: "Cannot Toggle",
        description: "Room is under maintenance. Only SuperAdmin can change this status.",
        variant: "destructive"
      });
      return;
    }
    
    if (roomToToggle) {
      toggleAvailability(roomToToggle, rooms, setRooms);
    } else {
      refetchRooms();
    }
  }, [rooms, toggleAvailability, refetchRooms, toast]);

  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      if (!user) return;
      
      // Get the current room to check if it's under maintenance
      const { data: roomData } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();
        
      // FIXED: Don't update availability for maintenance rooms
      if (roomData?.status === 'maintenance') {
        console.log("Skipping availability update for maintenance room:", roomId);
        return;
      }
      
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
      
      // Only update room status if not in maintenance
      await supabase
        .from('rooms')
        .update({
          status: newStatus
        })
        .eq('id', roomId);
      
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

  // Modified subscription setup to be more efficient
  const setupRoomSubscription = useCallback(() => {
    const roomChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        
        // Instead of full refetch, update the specific room in state
        if (payload.eventType === 'UPDATE' && payload.new && payload.new.id) {
          const updatedRoom = payload.new;
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoom.id ? 
              { 
                ...room,
                status: updatedRoom.status || room.status,
                isAvailable: updatedRoom.status === 'available'
              } : room
            )
          );
        } else {
          // For other events like INSERT or DELETE, do a full refetch
          fetchRooms();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [fetchRooms]);

  // Optimize the subscription to prevent excessive re-renders
  const setupOptimizedAvailabilitySubscription = useCallback(() => {
    const availabilityChannel = supabase
      .channel('room_availability_changes_optimized')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_availability' 
      }, (payload) => {
        console.log('Room availability change received:', payload);
        
        // Only do a full refetch if we can't update the specific room in state
        if (payload.eventType === 'INSERT' && payload.new && payload.new.room_id) {
          const updatedRoomId = payload.new.room_id;
          const isAvailable = payload.new.is_available;
          const status = payload.new.status || (isAvailable ? 'available' : 'occupied');
          
          // Update a specific room instead of refetching all rooms
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoomId && room.status !== 'maintenance' ? 
              { 
                ...room, 
                isAvailable: isAvailable,
                status: status as RoomStatus
              } : room
            )
          );
        } else {
          fetchRooms();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(availabilityChannel);
    };
  }, [fetchRooms]);

  useRoomReservationCheck(rooms, updateRoomAvailability);

  useEffect(() => {
    fetchRooms();
    
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupOptimizedAvailabilitySubscription();
    
    return () => {
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, [fetchRooms, setupRoomSubscription, setupOptimizedAvailabilitySubscription]);

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
