
import { useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useRoomStatus = (room: Room, onToggleAvailability: (roomId: string) => void) => {
  const { toast } = useToast();

  const getEffectiveStatus = (): RoomStatus => {
    if (room.status) return room.status;
    return room.isAvailable ? 'available' : 'occupied';
  };

  const handleStatusChange = async (status: RoomStatus) => {
    try {
      console.log("Updating room status to:", status);
      
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) throw roomError;
      
      toast({
        title: "Room status updated",
        description: `Room status changed to ${status}`,
      });
      
      onToggleAvailability(room.id);
    } catch (error) {
      console.error("Error updating room status:", error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };

  return {
    getEffectiveStatus,
    handleStatusChange
  };
};
