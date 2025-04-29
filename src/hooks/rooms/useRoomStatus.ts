
import { useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export const useRoomStatus = (room: Room, refetchRooms: () => Promise<void>) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const getEffectiveStatus = (): RoomStatus => {
    // Always prioritize maintenance status
    if (room.status === 'maintenance') return 'maintenance';
    // Otherwise use whatever status is set
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
      
      const previousStatus = room.status;
      
      // Get the building name for the announcement
      let buildingName = "Unknown Building";
      if (room.buildingId) {
        const { data: buildingData, error: buildingError } = await supabase
          .from('buildings')
          .select('name')
          .eq('id', room.buildingId)
          .single();
        
        if (!buildingError && buildingData) {
          buildingName = buildingData.name;
        } else if (buildingError) {
          console.error("Error fetching building name:", buildingError);
        }
      }
      
      // Update the room status in the database
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) {
        console.error("Error updating room status:", roomError);
        toast({
          title: "Error",
          description: "Failed to update room status: " + roomError.message,
          variant: "destructive"
        });
        return;  // Exit early on error
      }
      
      // Only create room_availability record if NOT setting to maintenance
      if (status !== 'maintenance') {
        // Determine if the room is available - only 'available' status is considered available
        const isAvailable = status === 'available';
        
        // Create a room_availability record to reflect the status change
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
          // Continue execution, don't return early
        }
      }
      
      // Handle announcement creation and removal based on status change
      if (status === 'maintenance') {
        // Create an announcement for the maintenance status
        const announcementTitle = `Room Under Maintenance: ${buildingName} - ${room.name}`;
        console.log("Creating maintenance announcement:", announcementTitle);
        
        const { data: existingAnnouncement, error: checkError } = await supabase
          .from('announcements')
          .select('id')
          .ilike('title', announcementTitle)
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking for existing announcement:", checkError);
        }
        
        // Only create if no existing announcement found
        if (!existingAnnouncement) {
          const { error: announcementError } = await supabase
            .from('announcements')
            .insert({
              title: announcementTitle,
              content: `Room ${room.name} in ${buildingName} is now under maintenance. Please note that this room will be temporarily unavailable for reservations.`,
              created_by: user.id
            });
            
          if (announcementError) {
            console.error("Error creating maintenance announcement:", announcementError);
            // Don't throw error here, still allow status change to succeed
          } else {
            toast({
              title: "Announcement Created",
              description: `A system announcement about ${room.name} maintenance has been posted.`,
            });
          }
        } else {
          console.log("Maintenance announcement already exists for this room");
        }
      } 
      // If the room was in maintenance before and is now available, remove maintenance announcements
      else if (previousStatus === 'maintenance' && status === 'available') {
        // Find and remove maintenance announcements for this room
        const announcementTitle = `Room Under Maintenance: ${buildingName} - ${room.name}`;
        console.log("Finding announcements to remove with title like:", announcementTitle);
        
        const { data: announcements, error: findError } = await supabase
          .from('announcements')
          .select('id')
          .ilike('title', announcementTitle);
        
        if (findError) {
          console.error("Error finding maintenance announcements:", findError);
        }
        
        if (announcements && announcements.length > 0) {
          console.log("Found announcements to delete:", announcements.length);
          
          // Delete found announcements
          const announcementIds = announcements.map(a => a.id);
          const { error: deleteError } = await supabase
            .from('announcements')
            .delete()
            .in('id', announcementIds);
          
          if (deleteError) {
            console.error("Error removing maintenance announcements:", deleteError);
          } else {
            toast({
              title: "Maintenance Ended",
              description: `Room ${room.name} is now available and maintenance announcements have been removed.`,
            });
          }
        } else {
          console.log("No maintenance announcements found to remove");
        }
      }
      
      // Show success toast only after all operations succeed
      toast({
        title: "Room status updated",
        description: `Room status changed to ${status}`,
      });
      
      // Force a refresh of room data through refetchRooms
      await refetchRooms();
      
    } catch (error: any) {
      console.error("Error updating room status:", error);
      toast({
        title: "Error",
        description: `Failed to update room status: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
      
      // Attempt to refresh the rooms data to ensure UI is in sync
      try {
        await refetchRooms();
      } catch (refreshError) {
        console.error("Failed to refresh rooms after error:", refreshError);
      }
    }
  };

  return {
    getEffectiveStatus,
    handleStatusChange
  };
};
