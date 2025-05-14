
import { useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomStatus } from '@/lib/types';

/**
 * Hook for managing real-time subscriptions to room data changes
 */
export function useRoomSubscriptions(
  fetchRooms: () => Promise<void>,
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
) {
  // Track if a refresh is in progress to prevent duplicate refreshes
  const refreshInProgress = useRef(false);
  
  // Set up subscription for room table changes
  const setupRoomSubscription = useCallback(() => {
    console.log("Setting up room subscription");
    
    const roomChannel = supabase
      .channel('room_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        
        // For update events, update the specific room in state
        if (payload.eventType === 'UPDATE' && payload.new && payload.new.id) {
          const updatedRoom = payload.new;
          const updatedRoomId = updatedRoom.id;
          const updatedStatus = updatedRoom.status as RoomStatus || 'available';
          const isAvailable = updatedStatus === 'available';
          
          console.log("Updating specific room in state:", updatedRoom);
          
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoomId ? 
              { 
                ...room,
                status: updatedStatus,
                isAvailable: isAvailable
              } : room
            )
          );
        } else if (!refreshInProgress.current) {
          // For other events like INSERT or DELETE, do a full refetch
          console.log("Performing full refetch due to non-update room change");
          refreshInProgress.current = true;
          fetchRooms().finally(() => {
            refreshInProgress.current = false;
          });
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
      .channel('availability_updates')
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
          
          // Get the explicit status or derive from isAvailable
          let status: RoomStatus;
          
          if ('status' in payload.new && payload.new.status) {
            status = payload.new.status as RoomStatus;
          } else {
            // Derive from is_available
            status = isAvailable ? 'available' : 'occupied';
          }
          
          console.log(`Updating room ${updatedRoomId} with isAvailable=${isAvailable}, status=${status}`);
          
          // Update a specific room instead of refetching all rooms
          setRooms(prevRooms => 
            prevRooms.map(room => 
              room.id === updatedRoomId && room.status !== 'maintenance' ? 
              { 
                ...room, 
                isAvailable: isAvailable,
                status: status
              } : room
            )
          );
        } else if (!refreshInProgress.current) {
          // For other events, do a full refetch
          console.log("Performing full refetch due to non-insert room availability change");
          refreshInProgress.current = true;
          fetchRooms().finally(() => {
            refreshInProgress.current = false;
          });
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
