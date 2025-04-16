
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
      
      // First, get the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Failed to get session:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        throw new Error("User not authenticated");
      }
      
      const userId = sessionData.session.user.id;
      if (!userId) {
        console.error("No user ID found in session");
        throw new Error("User not authenticated properly");
      }
      
      console.log("Current user ID:", userId);
      
      // Update the room status in the database
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) {
        console.error("Error updating room status:", roomError);
        throw roomError;
      }
      
      // Also create a room_availability record to reflect the status change
      const isAvailable = status === 'available';
      
      const { error: availError } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id,
          is_available: isAvailable,
          updated_by: userId,
          updated_at: new Date().toISOString()
        });
        
      if (availError) {
        console.error("Error updating room availability:", availError);
        throw availError;
      }
      
      // Create an announcement if room is under maintenance (status = 'maintenance')
      if (status === 'maintenance') {
        const { error: announcementError } = await supabase
          .from('announcements')
          .insert({
            title: "Room Under Maintenance",
            content: `Room ${room.name} is now under maintenance. Please note that this room will be temporarily unavailable for reservations.`,
            created_by: userId
          });
          
        if (announcementError) {
          console.error("Error creating maintenance announcement:", announcementError);
          // Don't throw error here, still allow status change to succeed
        }
      }
      
      toast({
        title: "Room status updated",
        description: `Room status changed to ${status}`,
      });
      
      // Force a refresh of room availability through the callback
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
