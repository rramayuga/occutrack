
import { useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export const useRoomStatus = (room: Room, onToggleAvailability: (roomId: string) => void) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const getEffectiveStatus = (): RoomStatus => {
    if (room.status) return room.status;
    return room.isAvailable ? 'available' : 'occupied';
  };

  const handleStatusChange = async (status: RoomStatus) => {
    try {
      console.log("Updating room status to:", status);
      
      // Check if attempting to set maintenance status
      if (status === 'maintenance' && user?.role !== 'superadmin') {
        console.error("Only superadmin can set rooms to maintenance status");
        toast({
          title: 'Permission Denied',
          description: 'Only SuperAdmin users can mark rooms for maintenance',
          variant: 'destructive'
        });
        return;
      }
      
      // If not authenticated, don't proceed
      if (!user) {
        console.error("No active session found");
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to change room status',
          variant: 'destructive'
        });
        return;
      }
      
      console.log("Current user ID:", user.id);
      
      // Update the room status in the database
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) {
        console.error("Error updating room status:", roomError);
        throw roomError;
      }
      
      // Determine if the room is available - only 'available' status is considered available
      const isAvailable = status === 'available';
      
      // Also create a room_availability record to reflect the status change
      const { error: availError } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id, 
          is_available: isAvailable,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          status: status // Store the exact status in the room_availability table
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
            created_by: user.id
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
