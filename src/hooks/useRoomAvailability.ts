
import { useState } from 'react';
import { Room } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useRoomAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleToggleRoomAvailability = async (room: Room, rooms: Room[], setRooms: React.Dispatch<React.SetStateAction<Room[]>>) => {
    // Only allow faculty to toggle room availability
    if (user?.role !== 'faculty') {
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
      // Create a custom room_availability record
      const { error } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id, 
          is_available: !room.isAvailable,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Update local state
      const updatedRooms = rooms.map(r => {
        if (r.id === room.id) {
          // Toggle the availability
          const updatedRoom = { ...r, isAvailable: !r.isAvailable };
          
          // Show a toast notification
          toast({
            title: updatedRoom.isAvailable ? "Room Available" : "Room Occupied",
            description: `${updatedRoom.name} is now ${updatedRoom.isAvailable ? 'available' : 'occupied'}.`,
            variant: updatedRoom.isAvailable ? "default" : "destructive"
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
    setupRoomAvailabilitySubscription
  };
}
