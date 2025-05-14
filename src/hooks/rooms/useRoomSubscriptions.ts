
import { useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomStatus } from '@/lib/types';

/**
 * Hook for managing real-time subscriptions to room data changes with optimizations
 * to prevent duplicate updates and excessive re-renders
 */
export function useRoomSubscriptions(
  fetchRooms: () => Promise<void>,
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
) {
  // Track if a refresh is in progress to prevent duplicate refreshes
  const refreshInProgress = useRef(false);
  // Store last updates to debounce frequent changes
  const lastUpdateTimestamps = useRef<Record<string, number>>({});
  // Debounce time in milliseconds
  const DEBOUNCE_TIME = 2000;
  
  // Set up subscription for room table changes with debounce logic
  const setupRoomSubscription = useCallback(() => {
    console.log("Setting up room subscription with debounce");
    
    const roomChannel = supabase
      .channel('room_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        
        // Implement debounce for frequent updates
        const now = Date.now();
        const lastUpdate = lastUpdateTimestamps.current[payload.table] || 0;
        
        // Only process if it's been at least DEBOUNCE_TIME since last update
        if (now - lastUpdate > DEBOUNCE_TIME) {
          lastUpdateTimestamps.current[payload.table] = now;
          
          // For update events, update the specific room in state
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.id) {
            const updatedRoom = payload.new;
            const updatedRoomId = updatedRoom.id;
            const updatedStatus = updatedRoom.status as RoomStatus || 'available';
            const isAvailable = updatedStatus === 'available';
            
            console.log("Optimized update for specific room in state:", updatedRoom);
            
            // Update only the specific room without triggering full re-render
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
          } else {
            // For other events like INSERT or DELETE, do a full refetch
            // Only if no refresh is currently in progress
            if (!refreshInProgress.current) {
              console.log("Performing debounced full refetch due to non-update room change");
              refreshInProgress.current = true;
              fetchRooms().finally(() => {
                setTimeout(() => {
                  refreshInProgress.current = false;
                }, 500); // Add delay before allowing next refresh
              });
            } else {
              console.log("Skipping redundant refetch, one already in progress");
            }
          }
        } else {
          console.log("Debounced update, ignoring change");
        }
      })
      .subscribe();

    return () => {
      console.log("Removing room subscription");
      supabase.removeChannel(roomChannel);
    };
  }, [fetchRooms, setRooms, DEBOUNCE_TIME]);

  // Set up subscription for room availability changes with similar debounce logic
  const setupRoomAvailabilitySubscription = useCallback(() => {
    console.log("Setting up room availability subscription with debounce");
    
    const availabilityChannel = supabase
      .channel('availability_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_availability' 
      }, (payload) => {
        console.log('Room availability change received:', payload);
        
        // Implement debounce for frequent updates
        const now = Date.now();
        const lastUpdate = lastUpdateTimestamps.current[payload.table] || 0;
        
        // Only process if it's been at least DEBOUNCE_TIME since last update
        if (now - lastUpdate > DEBOUNCE_TIME) {
          lastUpdateTimestamps.current[payload.table] = now;
          
          // Only update specific room for INSERT events (most recent record)
          if (payload.eventType === 'INSERT' && payload.new && payload.new.room_id) {
            const updatedRoomId = payload.new.room_id;
            const isAvailable = payload.new.is_available;
            
            // Get the explicit status or derive from isAvailable
            let status: RoomStatus;
            
            // Check if status exists in the payload
            if ('status' in payload.new && payload.new.status) {
              status = payload.new.status as RoomStatus;
            } else {
              // Derive from is_available
              status = isAvailable ? 'available' : 'occupied';
            }
            
            console.log(`Optimized update for room ${updatedRoomId} with isAvailable=${isAvailable}, status=${status}`);
            
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
          } else {
            // Only if no refresh is currently in progress
            if (!refreshInProgress.current) {
              console.log("Performing debounced full refetch due to non-insert room availability change");
              refreshInProgress.current = true;
              fetchRooms().finally(() => {
                setTimeout(() => {
                  refreshInProgress.current = false;
                }, 500); // Add delay before allowing next refresh
              });
            } else {
              console.log("Skipping redundant refetch, one already in progress");
            }
          }
        } else {
          console.log("Debounced update, ignoring change");
        }
      })
      .subscribe();

    return () => {
      console.log("Removing room availability subscription");
      supabase.removeChannel(availabilityChannel);
    };
  }, [fetchRooms, setRooms, DEBOUNCE_TIME]);

  return {
    setupRoomSubscription,
    setupRoomAvailabilitySubscription
  };
}
