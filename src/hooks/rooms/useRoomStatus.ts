
import { useState, useCallback } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';

export const useRoomStatus = (room?: Room, refetchRooms?: () => Promise<void>) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const updateRoomStatus = useCallback(async (room: Room, newStatus: 'available' | 'occupied' | 'maintenance') => {
    try {
      setIsUpdating(true);
      const prevStatus = room.status;
      
      console.log(`Updating room status: ${room.name} from ${prevStatus} to ${newStatus}`);
      
      // Update the room status
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', room.id);

      if (error) {
        console.error("Error updating room status:", error);
        toast({
          title: "Error",
          description: `Failed to update status for ${room.name}. ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Create an announcement if room is being set to maintenance
      if (newStatus === 'maintenance' && user && (user.role === 'admin' || user.role === 'superadmin')) {
        await createMaintenanceAnnouncement(room);
      }

      // Handle no refetch function
      if (!refetchRooms) {
        toast({
          title: "Status Updated",
          description: `${room.name} is now set to ${newStatus}.`,
        });
        return true;
      }

      // Get data about the room including its building info for better notifications
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          name,
          floor,
          buildings (name)
        `)
        .eq('id', room.id)
        .single();

      if (roomError) {
        console.error("Error fetching room details:", roomError);
      }

      // Mark a room available after maintenance
      if (prevStatus === 'maintenance' && newStatus !== 'maintenance') {
        toast({
          title: "Room Restored",
          description: `${room.name} is no longer under maintenance.`,
        });
      }
      
      // Mark a room as occupied
      if (newStatus === 'occupied' && prevStatus !== 'occupied') {
        toast({
          title: "Room Occupied",
          description: `${room.name} is now marked as occupied.`,
        });
      }
      
      // Mark a room as available
      if (newStatus === 'available' && prevStatus !== 'available') {
        toast({
          title: "Room Available",
          description: `${room.name} is now available for use.`,
        });
      }
      
      // Mark a room as under maintenance
      if (newStatus === 'maintenance' && prevStatus !== 'maintenance') {
        const building = roomData?.buildings?.name || 'Unknown Building';
        
        toast({
          title: "Room Under Maintenance",
          description: `${room.name} (${building}, Floor ${roomData?.floor || 'Unknown'}) is now under maintenance.`,
        });
      }
      
      // Refresh the room list to show updated status
      await refetchRooms();
      return true;
    } catch (error) {
      console.error("Error in updateRoomStatus:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating room status.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [refetchRooms, toast, user]);

  const createMaintenanceAnnouncement = async (room: Room) => {
    try {
      // First get building name
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          name,
          floor,
          buildings (name)
        `)
        .eq('id', room.id)
        .single();
      
      if (roomError) {
        console.error("Error fetching room details for announcement:", roomError);
        return;
      }
      
      const buildingName = roomData?.buildings?.name || 'Unknown Building';
      const title = `Room Maintenance: ${room.name}`;
      const content = `Room ${room.name} in ${buildingName} (Floor ${room.floor}) has been placed under maintenance. This room will be unavailable until further notice.`;
      
      // Create the announcement
      const { error: announcementError } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          created_by: user?.id
        });
      
      if (announcementError) {
        console.error("Error creating maintenance announcement:", announcementError);
      }
    } catch (error) {
      console.error("Error creating maintenance announcement:", error);
    }
  };

  // Add these two functions to fix the useRoomCardLogic errors
  const getEffectiveStatus = useCallback(() => {
    if (!room) return 'available' as RoomStatus;
    return room.status || 'available';
  }, [room]);

  const handleStatusChange = useCallback((newStatus: RoomStatus) => {
    if (!room) return;
    updateRoomStatus(room, newStatus);
  }, [room, updateRoomStatus]);

  return {
    updateRoomStatus,
    isUpdating,
    getEffectiveStatus,
    handleStatusChange
  };
};
