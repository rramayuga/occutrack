
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
        status: roomData.status || (roomData.isAvailable ? 'available' : 'occupied'),
      };

      const { data, error } = await supabase
        .from('rooms')
        .insert([dbRoomData])
        .select();

      if (error) {
        console.error("Error adding room:", error);
        toast({
          title: "Error adding room",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // If the room was successfully added, create a room availability record
      if (data && data.length > 0) {
        const { error: availabilityError } = await supabase
          .from('room_availability')
          .insert({
            room_id: data[0].id,
            is_available: roomData.isAvailable,
            updated_by: '00000000-0000-0000-0000-000000000000', // System update
          });
          
        if (availabilityError) {
          console.error("Error setting room availability:", availabilityError);
        }
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
      
      // Check for required columns
      const requiredColumns = ['name', 'type', 'floor', 'buildingId'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `CSV file must include the following columns: ${missingColumns.join(', ')}`,
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const data = lines[i].split(',');
        if (data.length !== headers.length) {
          console.error(`Line ${i} has incorrect number of columns`);
          errorCount++;
          continue;
        }
        
        try {
          // Create a map of column names to values
          const roomData: Record<string, any> = {};
          headers.forEach((header, index) => {
            roomData[header] = data[index].trim();
          });
          
          // Extract and convert data
          const buildingId = roomData.buildingId;
          const name = roomData.name;
          const type = roomData.type;
          const floor = parseInt(roomData.floor);
          const capacity = roomData.capacity ? parseInt(roomData.capacity) : 30;
          const isAvailable = roomData.isAvailable === 'true';
          const status = roomData.status || (isAvailable ? 'available' : 'occupied');
          
          if (isNaN(floor)) {
            console.error(`Invalid floor number in line ${i}`);
            errorCount++;
            continue;
          }
          
          // Check if this room already exists (by name and building)
          const { data: existingRooms, error: queryError } = await supabase
            .from('rooms')
            .select('id')
            .eq('name', name)
            .eq('building_id', buildingId);
            
          if (queryError) throw queryError;
          
          if (existingRooms && existingRooms.length > 0) {
            // Update existing room
            const { error: updateError } = await supabase
              .from('rooms')
              .update({
                type,
                floor,
                capacity,
                status,
              })
              .eq('id', existingRooms[0].id);
              
            if (updateError) throw updateError;
            
            // Also update room availability
            await supabase
              .from('room_availability')
              .insert({
                room_id: existingRooms[0].id,
                is_available: isAvailable,
                updated_by: '00000000-0000-0000-0000-000000000000', // System update
              });
              
            updateCount++;
          } else {
            // Insert new room
            const { data: newRoom, error: insertError } = await supabase
              .from('rooms')
              .insert([{
                name,
                type,
                floor,
                building_id: buildingId,
                capacity,
                status,
              }])
              .select();
              
            if (insertError) throw insertError;
            
            if (newRoom && newRoom.length > 0) {
              // Create room availability record
              await supabase
                .from('room_availability')
                .insert({
                  room_id: newRoom[0].id,
                  is_available: isAvailable,
                  updated_by: '00000000-0000-0000-0000-000000000000', // System update
                });
            }
            
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing line ${i}:`, error);
          errorCount++;
        }
      }
      
      // Show success toast with summary
      toast({
        title: "CSV Import Complete",
        description: `Successfully added ${successCount} rooms, updated ${updateCount} rooms. ${errorCount} errors occurred.`,
        variant: errorCount > 0 ? "default" : "default"
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
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          type,
          floor,
          building_id,
          capacity,
          status,
          buildings(name)
        `);

      if (error) {
        console.error("Error fetching rooms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch rooms for export.",
          variant: "destructive"
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No Rooms",
          description: "No rooms available to export.",
        });
        return;
      }

      // Format data for CSV
      const csvRows = [
        // Header row
        ['name', 'type', 'floor', 'buildingId', 'buildingName', 'capacity', 'status'].join(',')
      ];
      
      // Data rows
      data.forEach(room => {
        // TypeScript fix - use any to avoid errors
        const roomData = room as any;
        const buildingName = roomData.buildings?.name || '';
        csvRows.push([
          roomData.name,
          roomData.type,
          roomData.floor,
          roomData.building_id,
          buildingName,
          roomData.capacity,
          roomData.status || 'available'
        ].join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
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
