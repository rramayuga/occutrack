
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomStatus } from '@/lib/types';

/**
 * Hook for managing real-time subscriptions to room data changes
 */
export function useRoomSubscriptions(
  fetchRooms: () => Promise<void>,
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
) {
  // Set up subscription for room table changes
  const setupRoomSubscription = useCallback(() => {
    console.log("Setting up room subscription");
    
    const roomChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        
        // For update events, update the specific room in state
        if (payload.eventType === 'UPDATE' && payload.new && payload.new.id) {
          const updatedRoom = payload.new;
          
          console.log("Updating specific room in state:", updatedRoom);
          
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoom.id ? 
              { 
                ...room,
                status: updatedRoom.status || room.status,
                isAvailable: updatedRoom.status === 'available'
              } : room
            )
          );
        } else {
          // For other events like INSERT or DELETE, do a full refetch
          console.log("Performing full refetch due to non-update room change");
          fetchRooms();
        }
      })
      .subscribe((status) => {
        console.log("Room subscription status:", status);
      });

    return () => {
      console.log("Removing room subscription");
      supabase.removeChannel(roomChannel);
    };
  }, [fetchRooms, setRooms]);

  // Set up subscription for room availability changes
  const setupRoomAvailabilitySubscription = useCallback(() => {
    console.log("Setting up room availability subscription");
    
    const availabilityChannel = supabase
      .channel('room_availability_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_availability' 
      }, (payload) => {
        console.log('Room availability change received:', payload);
        
        // Only update specific room for INSERT events (most recent record)
        if (payload.eventType === 'INSERT' && payload.new && payload.new.room_id) {
          const updatedRoomId = payload.new.room_id;
          const isAvailable = payload.new.is_available;
          const status = payload.new.status || (isAvailable ? 'available' : 'occupied');
          
          console.log(`Updating room ${updatedRoomId} with isAvailable=${isAvailable}, status=${status}`);
          
          // Update a specific room instead of refetching all rooms
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoomId && room.status !== 'maintenance' ? 
              { 
                ...room, 
                isAvailable: isAvailable,
                status: status as RoomStatus
              } : room
            )
          );
        } else {
          console.log("Performing full refetch due to non-insert room availability change");
          fetchRooms();
        }
      })
      .subscribe((status) => {
        console.log("Room availability subscription status:", status);
      });

    return () => {
      console.log("Removing room availability subscription");
      supabase.removeChannel(availabilityChannel);
    };
  }, [fetchRooms, setRooms]);

  return {
    setupRoomSubscription,
    setupRoomAvailabilitySubscription
  };
}
