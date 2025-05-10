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
      console.log("Updating room status to:", status, "for room:", room.id, room.name);
      
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
      
      // If trying to change maintenance room status and not superadmin, block
      if (room.status === 'maintenance' && user.role !== 'superadmin') {
        console.error("Only superadmin can change status of maintenance rooms");
        toast({
          title: 'Permission Denied',
          description: 'Only SuperAdmin users can change the status of rooms under maintenance',
          variant: 'destructive'
        });
        return;
      }
      
      console.log("Current user ID:", user.id);
      
      const previousStatus = room.status;
      const isAvailable = status === 'available';
      
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
      
      console.log(`Updating room ${room.id} status from ${previousStatus} to ${status}`);
      
      // CRUCIAL FIX: Update the room status in the database first
      const { data: updatedRoom, error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id)
        .select();
      
      if (roomError) {
        console.error("Error updating room status:", roomError);
        toast({
          title: "Error",
          description: "Failed to update room status: " + roomError.message,
          variant: "destructive"
        });
        return;  // Exit early on error
      }
      
      console.log("Room status updated successfully in database:", updatedRoom);
      
      // Create a room_availability record to track the change
      try {
        const { data: availData, error: availError } = await supabase
          .from('room_availability')
          .insert({
            room_id: room.id, 
            is_available: isAvailable,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
            status: status // Store the exact status in the room_availability table
          })
          .select();
            
        if (availError) {
          console.error("Error updating room availability:", availError);
        } else {
          console.log("Room availability record created:", availData);
        }
      } catch (availabilityError) {
        console.error("Error with availability record:", availabilityError);
        // Continue execution - don't block the main flow if availability record fails
      }
      
      // Handle announcement creation and removal based on status change
      if (status === 'maintenance') {
        // Create an announcement for the maintenance status
        const announcementTitle = `Room Under Maintenance: ${buildingName} - ${room.name}`;
        console.log("Creating maintenance announcement:", announcementTitle);
        
        // Fix: Use better query to check for existing maintenance announcement for this room
        const { data: existingAnnouncement, error: checkError } = await supabase
          .from('announcements')
          .select('id')
          .ilike('title', `%${room.name}%`)
          .ilike('title', '%Under Maintenance%')
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking for existing announcement:", checkError);
        }
        
        // Only create if no existing announcement found
        if (!existingAnnouncement) {
          console.log("No existing maintenance announcement found, creating new one");
          
          const { error: announcementError } = await supabase
            .from('announcements')
            .insert({
              title: announcementTitle,
              content: `Room ${room.name} in ${buildingName} is now under maintenance. Please note that this room will be temporarily unavailable for reservations.`,
              created_by: user.id
            });
            
          if (announcementError) {
            console.error("Error creating maintenance announcement:", announcementError);
            toast({
              title: "Error",
              description: "Failed to create maintenance announcement: " + announcementError.message,
              variant: "destructive"
            });
          } else {
            console.log("Created maintenance announcement successfully");
            toast({
              title: "Announcement Created",
              description: `A system announcement about ${room.name} maintenance has been posted.`,
            });
          }
        } else {
          console.log("Maintenance announcement already exists for this room:", existingAnnouncement);
        }
      } 
      // If the room was in maintenance before and is now NOT in maintenance
      // Fixed TypeScript error by changing the condition
      else if (previousStatus === 'maintenance' && status !== 'maintenance') {
        // Find and remove maintenance announcements for this room
        console.log(`Looking for maintenance announcements to remove for room ${room.name}`);
        
        const { data: announcements, error: findError } = await supabase
          .from('announcements')
          .select('id, title')
          .ilike('title', `%${room.name}%`)
          .ilike('title', '%Under Maintenance%');
        
        if (findError) {
          console.error("Error finding maintenance announcements:", findError);
        }
        
        if (announcements && announcements.length > 0) {
          console.log(`Found ${announcements.length} announcements to delete:`, announcements);
          
          // Delete found announcements
          const announcementIds = announcements.map(a => a.id);
          const { error: deleteError } = await supabase
            .from('announcements')
            .delete()
            .in('id', announcementIds);
          
          if (deleteError) {
            console.error("Error removing maintenance announcements:", deleteError);
            toast({
              title: "Error",
              description: "Failed to remove maintenance announcements: " + deleteError.message,
              variant: "destructive"
            });
          } else {
            console.log("Successfully removed maintenance announcements");
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
      
      // Force a refresh of room data after completed DB operations
      await refetchRooms();
      
    } catch (error: any) {
      console.error("Error updating room status:", error);
      toast({
        title: "Error",
        description: `Failed to update room status: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  return {
    getEffectiveStatus,
    handleStatusChange
  };
};
