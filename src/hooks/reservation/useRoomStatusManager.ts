
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoomStatus } from '@/lib/types';

export function useRoomStatusManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Improved tracking system with significantly longer cooldown periods
  // Map to track the last update time for each room to prevent redundant updates
  const updateTracker = new Map<string, {
    status: RoomStatus, 
    timestamp: number, 
    attempts: number,
    reservationId?: string,
    persistent: boolean // New flag to mark status as locked/persistent
  }>();

  // Set room status based on reservation time with optimized update prevention
  const updateRoomStatus = async (roomId: string, isOccupied: boolean, reservationId?: string) => {
    try {
      const newStatus: RoomStatus = isOccupied ? 'occupied' : 'available';
      
      // Create a more specific key that includes the reservation ID if available
      // This allows us to track updates per reservation, reducing redundancy
      const trackerKey = reservationId ? `${roomId}-${reservationId}` : roomId;
      
      // Check if we already updated this room with the same status recently
      const lastUpdate = updateTracker.get(trackerKey);
      const now = Date.now();
      
      // If this status is marked as persistent, we don't update it again
      // This prevents toggling by locking the status for the duration
      if (lastUpdate && lastUpdate.status === newStatus && lastUpdate.persistent) {
        console.log(`Skipping update for room ${roomId} - status ${newStatus} is locked as persistent`);
        return true; // Return success but skip the update
      }
      
      // Much more aggressive cooldown for multiple attempts at the same status
      if (lastUpdate && lastUpdate.status === newStatus) {
        // Scale the cooldown period based on how many times we've tried to update to the same status
        // First attempt: 2 minutes, subsequent attempts increase cooldown dramatically
        const cooldownPeriod = Math.min(180000 + (lastUpdate.attempts * 120000), 1800000); // Cap at 30 minutes (increased)

        if (now - lastUpdate.timestamp < cooldownPeriod) { 
          console.log(`Skipping redundant update for room ${roomId} to status ${newStatus} - last updated ${Math.round((now - lastUpdate.timestamp) / 1000)}s ago (attempt #${lastUpdate.attempts})`);
          return true; // Return success but skip the update
        }
      }
      
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'} ${reservationId ? `for reservation ${reservationId}` : ''}`);
      
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
        
        // Update tracker with current attempt count and extend timestamp to prevent further checks
        // Now mark the status as persistent when it's already correct to prevent toggling
        const existingUpdate = updateTracker.get(trackerKey);
        updateTracker.set(trackerKey, {
          status: newStatus, 
          timestamp: now,
          attempts: existingUpdate ? existingUpdate.attempts + 1 : 1,
          reservationId,
          persistent: true // Mark as persistent to lock this status
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
      // For occupied status, mark as persistent to prevent toggling
      updateTracker.set(trackerKey, {
        status: newStatus, 
        timestamp: now, 
        attempts: 1,
        reservationId,
        persistent: isOccupied // Only make occupied status persistent
      });
      
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
