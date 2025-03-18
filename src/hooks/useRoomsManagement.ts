
import { useState } from 'react';
import { Room } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useRoomsManagement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      // Map frontend field names to database column names
      const dbRoomData = {
        name: roomData.name,
        type: roomData.type,
        floor: roomData.floor,
        building_id: roomData.buildingId, // Map buildingId to building_id
        capacity: roomData.capacity || 30, // Ensure capacity is always provided
      };

      const { data, error } = await supabase
        .from('rooms')
        .insert([dbRoomData]);

      if (error) {
        console.error("Error adding room:", error);
        toast({
          title: "Error adding room",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Room added successfully.",
      });
      return true;
    } catch (error) {
      console.error("Unexpected error adding room:", error);
      toast({
        title: "Error adding room",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleRoomCsvUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      if (!headers.includes('name') || !headers.includes('type') || !headers.includes('floor') || !headers.includes('buildingId') || !headers.includes('isAvailable')) {
        toast({
          title: "Error",
          description: "CSV file must include 'name', 'type', 'floor', 'buildingId', and 'isAvailable' columns.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      const rooms = [];
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length === headers.length) {
          const roomData = {
            name: data[headers.indexOf('name')],
            type: data[headers.indexOf('type')],
            floor: parseInt(data[headers.indexOf('floor')]),
            building_id: data[headers.indexOf('buildingId')], // Map buildingId to building_id
            capacity: 30, // Default capacity
            is_available: data[headers.indexOf('isAvailable')] === 'true'
          };
          rooms.push(roomData);
        }
      }

      // Use a loop to insert rooms one by one
      for (const roomData of rooms) {
        const { data, error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) {
          console.error("Error uploading room:", error);
          toast({
            title: "Error",
            description: `Error uploading room: ${error.message}`,
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
      }

      toast({
        title: "Success",
        description: "Rooms uploaded successfully.",
      });
    } catch (error) {
      console.error("Error processing CSV file:", error);
      toast({
        title: "Error",
        description: "Error processing CSV file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const exportRoomsToCsv = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*');

      if (error) {
        console.error("Error fetching rooms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch rooms for export.",
          variant: "destructive"
        });
        return;
      }

      if (!rooms || rooms.length === 0) {
        toast({
          title: "No Rooms",
          description: "No rooms available to export.",
        });
        return;
      }

      const headers = Object.keys(rooms[0]).join(',');
      const csv = [
        headers,
        ...rooms.map(room => Object.values(room).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'rooms.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Rooms exported to CSV successfully.",
      });
    } catch (error) {
      console.error("Error exporting rooms to CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export rooms to CSV.",
        variant: "destructive"
      });
    }
  };

  return {
    addRoom,
    handleRoomCsvUpload,
    exportRoomsToCsv,
    isUploading
  };
};
