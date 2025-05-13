
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Update room status in database
      const newStatus = isOccupied ? 'occupied' : 'available';
      
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);
      
      if (error) {
        console.error("Error updating room status:", error);
        return false;
      }
      
      console.log(`Successfully updated room ${roomId} to status: ${newStatus}`);
      
      // Create availability record
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
