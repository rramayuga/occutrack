
import { useCallback, useRef } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

/**
 * Hook for updating room data in the database
 */
export function useRoomUpdater(
  rooms: Room[],
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>,
  refetchRooms: () => Promise<void>
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateInProgress = useRef<Record<string, boolean>>({});

  // Update room availability in the database
  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean, explicitStatus?: RoomStatus) => {
    try {
      if (!user) return;
      
      // Prevent concurrent updates to the same room
      if (updateInProgress.current[roomId]) {
        console.log(`Update already in progress for room ${roomId}, skipping duplicate request`);
        return;
      }
      
      updateInProgress.current[roomId] = true;
      console.log(`Updating availability for room ${roomId} to ${isAvailable}, status: ${explicitStatus || 'derived from isAvailable'}`);
      
      // Get the current room to check if it's under maintenance
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error("Error checking room status:", roomError);
        updateInProgress.current[roomId] = false;
        return;
      }
      
      // If room is under maintenance and user is not superadmin, don't allow updates
      if (roomData?.status === 'maintenance' && user.role !== 'superadmin') {
        console.log("Cannot update a maintenance room unless superadmin");
        toast({
          title: "Permission Denied",
          description: "Only SuperAdmin users can change the status of rooms under maintenance",
          duration: 3000
        });
        updateInProgress.current[roomId] = false;
        return;
      }
      
      // Use explicit status if provided, otherwise derive from isAvailable
      const newStatus: RoomStatus = explicitStatus || (isAvailable ? 'available' : 'occupied');
      
      // Update the rooms table first with the new status
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: newStatus
        })
        .eq('id', roomId);
      
      if (updateError) {
        console.error("Error updating room status:", updateError);
        toast({
          title: "Error",
          description: `Failed to update room status: ${updateError.message}`,
          duration: 3000
        });
        updateInProgress.current[roomId] = false;
        return;
      }
      
      console.log(`Room status updated in database to ${newStatus}`);
      
      // Then create an availability record to track the change
      try {
        const { error: availError } = await supabase
          .from('room_availability')
          .insert({
            room_id: roomId,
            is_available: isAvailable,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          });
        
        if (availError) {
          console.error("Error creating availability record:", availError);
        } else {
          console.log("Room availability record created successfully");
        }
      } catch (availabilityError) {
        console.error("Error with availability record:", availabilityError);
      }
      
      // Update local state optimistically
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { 
            ...room, 
            isAvailable,
            status: newStatus
          } : room
        )
      );
      
      // Force a refresh to ensure all components have the latest data
      setTimeout(() => refetchRooms(), 300);
      
    } catch (error: any) {
      console.error("Error updating room availability:", error);
      toast({
        title: "Error",
        description: `Failed to update room availability: ${error?.message || 'Unknown error'}`,
        duration: 3000
      });
    } finally {
      // Clear update lock
      updateInProgress.current[roomId] = false;
    }
  }, [user, setRooms, toast, refetchRooms]);

  // Handle toggling room availability
  const handleToggleRoomAvailability = useCallback((roomId: string) => {
    console.log("Toggle availability for room:", roomId);
    const roomToToggle = rooms.find(room => room.id === roomId);
    
    // Block toggling availability for maintenance rooms by non-superadmins
    if (roomToToggle && roomToToggle.status === 'maintenance' && user?.role !== 'superadmin') {
      toast({
        title: "Cannot Toggle",
        description: "Room is under maintenance. Only SuperAdmin can change this status.",
        duration: 3000
      });
      return;
    }
    
    if (roomToToggle) {
      const newIsAvailable = !roomToToggle.isAvailable;
      const newStatus = newIsAvailable ? 'available' : 'occupied';
      updateRoomAvailability(roomId, newIsAvailable, newStatus);
    } else {
      console.log("Room not found in local state, refreshing data");
      refetchRooms();
    }
  }, [rooms, updateRoomAvailability, refetchRooms, toast, user]);

  return {
    updateRoomAvailability,
    handleToggleRoomAvailability
  };
}
