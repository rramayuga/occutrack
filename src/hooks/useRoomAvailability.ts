import { useState, useCallback } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useRoomAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Add the getAvailableRooms function
  const getAvailableRooms = useCallback(async () => {
    try {
      // Fetch rooms that are currently available
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*, buildings(name)')
        .eq('status', 'available');
      
      if (roomsError) throw roomsError;
      
      // Transform to match Room type
      return roomsData ? roomsData.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        isAvailable: true,
        floor: room.floor,
        buildingId: room.building_id,
        status: 'available' as RoomStatus
      })) : [];
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      return [];
    }
  }, []);

  const handleToggleRoomAvailability = async (room: Room, rooms: Room[], setRooms: React.Dispatch<React.SetStateAction<Room[]>>) => {
    // Allow faculty, admin, and superadmin users to toggle room availability
    const authorizedRoles = ['faculty', 'admin', 'superadmin'];
    if (!user || !authorizedRoles.includes(user.role)) {
      if (user?.role === 'student') {
        toast({
          title: "Access Denied",
          description: "Students cannot change room availability.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      // FIXED: If the room is under maintenance, don't allow toggling availability
      if (room.status === 'maintenance') {
        toast({
          title: "Cannot Change Availability",
          description: "Room is under maintenance. Only SuperAdmin users can change this status.",
          variant: "destructive"
        });
        return;
      }

      // Determine the new status based on current status
      let newStatus: RoomStatus;
      if (room.status === 'available') {
        newStatus = 'occupied';
      } else if (room.status === 'occupied') {
        newStatus = 'available';
      } else {
        newStatus = 'available'; // Default case
      }
      
      // Determine if the room is available - only 'available' status is considered available
      const isAvailable = newStatus === 'available';
      
      // Create a custom room_availability record
      const { error } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id, 
          is_available: isAvailable,
          status: newStatus, // Store the exact status
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Update the room status in the rooms table
      const { error: statusError } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', room.id);
        
      if (statusError) throw statusError;

      // Update local state
      const updatedRooms = rooms.map(r => {
        if (r.id === room.id) {
          // Update both status and isAvailable
          const updatedRoom: Room = { 
            ...r, 
            isAvailable: isAvailable,
            status: newStatus
          };
          
          // Show a toast notification
          toast({
            title: updatedRoom.status === 'available' ? "Room Available" : 
                  updatedRoom.status === 'occupied' ? "Room Occupied" : 
                  "Room Under Maintenance",
            description: `${updatedRoom.name} is now ${updatedRoom.status}.`,
            variant: updatedRoom.status === 'available' ? "default" : 
                    updatedRoom.status === 'maintenance' ? "destructive" : "default"
          });
          
          return updatedRoom;
        }
        return r;
      });
      
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Error toggling room availability:", error);
      toast({
        title: "Error",
        description: "Failed to update room availability.",
        variant: "destructive"
      });
    }
  };

  const setupRoomAvailabilitySubscription = (fetchRooms: () => Promise<void>) => {
    const availabilityChannel = supabase
      .channel('room_availability_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_availability' 
      }, (payload) => {
        console.log('Room availability change received:', payload);
        fetchRooms(); // Refresh rooms to get the latest availability
      })
      .subscribe();

    return () => {
      supabase.removeChannel(availabilityChannel);
    };
  };

  return {
    handleToggleRoomAvailability,
    setupRoomAvailabilitySubscription,
    getAvailableRooms // Add this to the returned object
  };
}
