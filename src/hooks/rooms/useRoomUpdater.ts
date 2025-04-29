
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
      
      // Get the current room to check if it's under maintenance
      const { data: roomData } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();
        
      // Don't update availability for maintenance rooms
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
  }, [user, setRooms]);

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
