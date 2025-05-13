
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useRoomStatusManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Set room status based on reservation time
  const updateRoomStatus = async (roomId: string, isOccupied: boolean) => {
    try {
      // Update room status in database
      const newStatus = isOccupied ? 'occupied' : 'available';
      
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);
      
      if (error) throw error;
      
      // Create availability record
      await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: !isOccupied,
          status: newStatus,
          updated_by: user?.id || '',
          updated_at: new Date().toISOString()
        });
      
      if (isOccupied) {
        toast({
          title: "Room Now Occupied",
          description: "Your reserved room is now marked as occupied for your schedule.",
        });
      } else {
        toast({
          title: "Room Now Available",
          description: "Your reservation has ended and the room is now available.",
        });
      }
    } catch (error) {
      console.error("Error updating room status:", error);
    }
  };

  return { updateRoomStatus };
}
