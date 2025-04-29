
import { useCallback } from 'react';
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

  // Update room availability in the database
  const updateRoomAvailability = useCallback(async (roomId: string, isAvailable: boolean) => {
    try {
      if (!user) return;
      
      console.log(`Updating availability for room ${roomId} to ${isAvailable}`);
      
      // Get the current room to check if it's under maintenance
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error("Error checking room status:", roomError);
        return;
      }
        
      // Don't update availability for maintenance rooms
      if (roomData?.status === 'maintenance') {
        console.log("Skipping availability update for maintenance room:", roomId);
        return;
      }
      
      const newStatus: RoomStatus = isAvailable ? 'available' : 'occupied';
      
      // Update the rooms table first
      const { data: updatedRoom, error: updateError } = await supabase
        .from('rooms')
        .update({
          status: newStatus
        })
        .eq('id', roomId)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating room status:", updateError);
        return;
      }
      
      console.log("Room status updated:", updatedRoom);
      
      // Then create an availability record
      const { data: availData, error: availError } = await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: isAvailable,
          status: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (availError) {
        console.error("Error creating availability record:", availError);
      } else {
        console.log("Room availability record created:", availData);
      }
      
      // Update local state
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { 
            ...room, 
            isAvailable,
            status: newStatus
          } : room
        )
      );
      
      // Force refresh to ensure consistency
      await refetchRooms();
      
    } catch (error: any) {
      console.error("Error updating room availability:", error);
      toast({
        title: "Error",
        description: `Failed to update room availability: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }, [user, setRooms, refetchRooms, toast]);

  // Handle toggling room availability
  const handleToggleRoomAvailability = useCallback((roomId: string) => {
    console.log("Toggle availability for room:", roomId);
    const roomToToggle = rooms.find(room => room.id === roomId);
    
    // Block toggling availability for maintenance rooms
    if (roomToToggle && roomToToggle.status === 'maintenance') {
      toast({
        title: "Cannot Toggle",
        description: "Room is under maintenance. Only SuperAdmin can change this status.",
        variant: "destructive"
      });
      return;
    }
    
    if (roomToToggle) {
      const newIsAvailable = !roomToToggle.isAvailable;
      updateRoomAvailability(roomId, newIsAvailable);
    } else {
      refetchRooms();
    }
  }, [rooms, updateRoomAvailability, refetchRooms, toast]);

  return {
    updateRoomAvailability,
    handleToggleRoomAvailability
  };
}
