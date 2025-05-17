
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoomStatus } from '@/lib/types';

export function useRoomStatusManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Improved tracking system for room status updates with longer cooldowns
  // Map to track the last update time for each room to prevent redundant updates
  const updateTracker = new Map<string, {status: RoomStatus, timestamp: number, attempts: number}>();

  // Set room status based on reservation time with optimized update prevention
  const updateRoomStatus = async (roomId: string, isOccupied: boolean) => {
    try {
      const newStatus: RoomStatus = isOccupied ? 'occupied' : 'available';
      
      // Check if we already updated this room with the same status recently (60 second cooldown)
      const lastUpdate = updateTracker.get(roomId);
      const now = Date.now();
      
      // More aggressive cooldown for multiple attempts at the same status
      if (lastUpdate && lastUpdate.status === newStatus) {
        // Scale the cooldown period based on how many times we've tried to update to the same status
        // First attempt: 30 seconds, subsequent attempts increase cooldown
        const cooldownPeriod = Math.min(30000 + (lastUpdate.attempts * 15000), 120000); // Cap at 120 seconds

        if (now - lastUpdate.timestamp < cooldownPeriod) { 
          console.log(`Skipping redundant update for room ${roomId} to status ${newStatus} - last updated ${(now - lastUpdate.timestamp) / 1000}s ago (attempt #${lastUpdate.attempts})`);
          return true; // Return success but skip the update
        }
      }
      
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'}`);
      
      if (!roomId) {
        console.error("Cannot update room status: Missing roomId");
        return false;
      }
      
      // Get current room status to check if it's under maintenance
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status, name')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error("Error fetching room status:", roomError);
        return false;
      }
      
      // Don't update rooms under maintenance
      if (roomData.status === 'maintenance') {
        console.log(`Room ${roomData.name} is under maintenance, skipping status update`);
        return false;
      }
      
      // Prevent unnecessary updates by checking if current status matches what we want
      if (roomData.status === newStatus) {
        console.log(`Room ${roomData.name} already has status ${newStatus}, skipping database update`);
        
        // Update tracker with current attempt count
        const existingUpdate = updateTracker.get(roomId);
        updateTracker.set(roomId, {
          status: newStatus, 
          timestamp: now,
          attempts: existingUpdate ? existingUpdate.attempts + 1 : 1
        });
        
        return true;
      }
      
      // Update room status in database - use only the status field
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        return false;
      }
      
      console.log(`Successfully updated room ${roomId} to status: ${newStatus}`);
      
      // Record this update in our tracker with attempt count reset
      updateTracker.set(roomId, {status: newStatus, timestamp: now, attempts: 1});
      
      // Create availability record - this is important for analytics tracking
      if (user) {
        await supabase
          .from('room_availability')
          .insert({
            room_id: roomId,
            is_available: !isOccupied,
            status: newStatus,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating room status:", error);
      return false;
    }
  };

  return { updateRoomStatus };
}
