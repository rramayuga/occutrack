
import { supabase } from "@/integrations/supabase/client";
import { RoomStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useRoomStatusManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Set room status based on reservation time
  const updateRoomStatus = async (roomId: string, isOccupied: boolean) => {
    try {
      console.log(`Updating room ${roomId} status to ${isOccupied ? 'occupied' : 'available'}`);
      
      if (!roomId) {
        console.error("Cannot update room status: Missing roomId");
        return false;
      }

      if (!user) {
        console.error("User must be logged in to update room status");
        return false;
      }
      
      // Add a short delay to ensure the status change has time to propagate
      // This helps prevent flickering or race conditions
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
        toast({
          title: "Status Not Changed",
          description: `Room ${roomData.name} is under maintenance and cannot be automatically updated.`,
          variant: "default"
        });
        return false;
      }
      
      // Update room status in database
      const newStatus: RoomStatus = isOccupied ? 'occupied' : 'available';
      
      const { error } = await supabase
        .from('rooms')
        .update({ 
          status: newStatus,
          // Also update the isAvailable flag to ensure consistency
          is_available: !isOccupied
        })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        toast({
          title: "Error",
          description: `Failed to update room status: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      // Create availability record for tracking
      await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: !isOccupied,
          status: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      // Log successful update
      console.log(`Successfully updated room ${roomId} to status: ${newStatus}`);
      
      return true;
    } catch (error) {
      console.error("Error updating room status:", error);
      return false;
    }
  };

  return { updateRoomStatus };
}
