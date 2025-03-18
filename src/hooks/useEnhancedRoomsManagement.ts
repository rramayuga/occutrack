
import { useRoomsManagement } from '@/hooks/useRoomsManagement';
import { Room } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export const useEnhancedRoomsManagement = () => {
  const originalHook = useRoomsManagement();
  const { toast } = useToast();
  
  // Enhance the addRoom function to always include capacity
  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      // Make sure capacity is always present
      const enhancedRoomData = {
        ...roomData,
        capacity: roomData.capacity || 30 // Default capacity if not provided
      };
      
      return await originalHook.addRoom(enhancedRoomData);
    } catch (error) {
      toast({
        title: "Error adding room",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Return the original hook with the enhanced function
  return {
    ...originalHook,
    addRoom
  };
};
