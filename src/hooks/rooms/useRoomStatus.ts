
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
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error("User not authenticated");
      
      // Update the room status in the database
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) throw roomError;
      
      // Also create a room_availability record to reflect the status change
      const isAvailable = status === 'available';
      
      const { error: availError } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id,
          is_available: isAvailable,
          updated_by: userId
        });
        
      if (availError) throw availError;
      
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
