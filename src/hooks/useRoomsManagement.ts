
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { Room } from '@/lib/types';

export function useRoomsManagement() {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add a room.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const newRoom = {
        name: roomData.name,
        type: roomData.type,
        floor: roomData.floor,
        building_id: roomData.buildingId,
        created_by: user.id
      };
      
      // Adding console log to debug
      console.log("Attempting to add room with data:", newRoom);
      
      const { data, error } = await supabase
        .from('rooms')
        .insert(newRoom)
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Also update room_availability table to set initial availability
        const { error: availabilityError } = await supabase
          .from('room_availability')
          .insert({
            room_id: data[0].id,
            is_available: roomData.isAvailable,
            updated_by: user.id
          });
          
        if (availabilityError) {
          console.error("Error setting room availability:", availabilityError);
        }
        
        toast({
          title: "Room added",
          description: `${roomData.name} has been added to the selected building.`
        });
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "Failed to add room.",
        variant: "destructive"
      });
      return null;
    }
  };

  const exportRoomsToCsv = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          type,
          is_available,
          floor,
          building_id
        `);
      
      if (error) throw error;
      
      if (!rooms || rooms.length === 0) {
        toast({
          title: "No data",
          description: "There are no rooms to export.",
          variant: "destructive"
        });
        return;
      }
      
      const headers = ['id', 'name', 'type', 'floor', 'building_id', 'is_available'];
      const csvContent = [
        headers.join(','),
        ...rooms.map(room => 
          headers.map(header => {
            // Convert header to the actual property name in the room object
            const propName = header === 'building_id' ? 'building_id' : 
                            header === 'is_available' ? 'is_available' : 
                            header;
            const value = room[propName as keyof typeof room];
            return String(value);
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'rooms.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Exported ${rooms.length} rooms to CSV.`
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export failed",
        description: "Could not export rooms to CSV.",
        variant: "destructive"
      });
    }
  };

  const handleRoomCsvUpload = async (file: File) => {
    if (!file) return;
    if (!user) {
      toast({
        title: "Authentication required", 
        description: "You must be logged in to upload data.", 
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const csvText = await file.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Validate headers
      const requiredHeaders = ['name', 'type', 'floor', 'building_id', 'is_available'];
      const hasAllHeaders = requiredHeaders.every(header => 
        headers.includes(header)
      );
      
      if (!hasAllHeaders) {
        throw new Error("CSV file is missing required headers");
      }
      
      // Parse rows
      const roomsToInsert = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        const roomData: any = {
          created_by: user.id
        };
        
        headers.forEach((header, index) => {
          if (header === 'floor') {
            roomData[header] = parseInt(values[index], 10);
          } else if (header === 'is_available') {
            roomData[header] = values[index].toLowerCase() === 'true';
          } else if (header === 'building_id') {
            roomData.building_id = values[index];
          } else {
            roomData[header] = values[index];
          }
        });
        
        // Validate building exists
        const { data: buildingExists, error: buildingError } = await supabase
          .from('buildings')
          .select('id')
          .eq('id', roomData.building_id)
          .single();
        
        if (buildingError || !buildingExists) {
          toast({
            title: "Warning",
            description: `Building ID ${roomData.building_id} not found for room ${roomData.name}`,
            variant: "destructive"
          });
          continue;
        }
        
        roomsToInsert.push(roomData);
      }
      
      if (roomsToInsert.length === 0) {
        toast({
          title: "No valid rooms",
          description: "No valid rooms found in the CSV file.",
          variant: "destructive"
        });
        return;
      }
      
      // Insert rooms in batches if needed
      const { error } = await supabase
        .from('rooms')
        .insert(roomsToInsert);
      
      if (error) throw error;
      
      toast({
        title: "Import successful",
        description: `Imported ${roomsToInsert.length} rooms from CSV.`
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Import failed",
        description: "Could not process the CSV file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    addRoom,
    exportRoomsToCsv,
    handleRoomCsvUpload,
    isUploading
  };
}
