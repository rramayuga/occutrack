
import { useState } from 'react';
import { Room } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useRoomsManagement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      const dbRoomData = {
        name: roomData.name,
        type: roomData.type,
        floor: roomData.floor,
        building_id: roomData.buildingId,
        capacity: roomData.capacity || 30,
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

      if (data && data.length > 0) {
        const { error: availabilityError } = await supabase
          .from('room_availability')
          .insert({
            room_id: data[0].id,
            is_available: roomData.isAvailable,
            updated_by: '00000000-0000-0000-0000-000000000000',
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

  const deleteRoom = async (roomId: string) => {
    try {
      console.log("Attempting to delete room and related records for roomId:", roomId);
      
      // First, fetch and check if there are any room_availability records
      const { data: availabilityData, error: availabilityCheckError } = await supabase
        .from('room_availability')
        .select('id')
        .eq('room_id', roomId);
        
      if (availabilityCheckError) {
        console.error("Error checking room availability records:", availabilityCheckError);
        toast({
          title: "Error deleting room",
          description: "Failed to check room availability records: " + availabilityCheckError.message,
          variant: "destructive"
        });
        return false;
      }
      
      // Delete each availability record individually to ensure they're all removed
      if (availabilityData && availabilityData.length > 0) {
        console.log(`Found ${availabilityData.length} room_availability records to delete`);
        
        for (const record of availabilityData) {
          const { error: deleteError } = await supabase
            .from('room_availability')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            console.error(`Error deleting room_availability record ${record.id}:`, deleteError);
            toast({
              title: "Error deleting room",
              description: "Failed to delete all room availability records. Please try again.",
              variant: "destructive"
            });
            return false;
          }
        }
        
        console.log("All room availability records deleted successfully");
      } else {
        console.log("No room_availability records found for this room");
      }
      
      // Next, check for any reservations
      const { data: reservationsData, error: reservationsCheckError } = await supabase
        .from('room_reservations')
        .select('id')
        .eq('room_id', roomId);
        
      if (reservationsCheckError) {
        console.error("Error checking room reservations:", reservationsCheckError);
        toast({
          title: "Error deleting room",
          description: "Failed to check room reservation records: " + reservationsCheckError.message,
          variant: "destructive"
        });
        return false;
      }
      
      // Delete each reservation individually
      if (reservationsData && reservationsData.length > 0) {
        console.log(`Found ${reservationsData.length} room_reservations records to delete`);
        
        for (const record of reservationsData) {
          const { error: deleteError } = await supabase
            .from('room_reservations')
            .delete()
            .eq('id', record.id);
            
          if (deleteError) {
            console.error(`Error deleting room_reservation record ${record.id}:`, deleteError);
            toast({
              title: "Error deleting room",
              description: "Failed to delete all room reservation records. Please try again.",
              variant: "destructive"
            });
            return false;
          }
        }
        
        console.log("All room reservation records deleted successfully");
      } else {
        console.log("No room_reservations records found for this room");
      }
      
      // Finally, delete the room itself after ensuring all related records are gone
      console.log("Deleting the room...");
      const { error: roomError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
      
      if (roomError) {
        console.error("Error deleting room:", roomError);
        toast({
          title: "Error deleting room",
          description: roomError.message,
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Room deleted successfully");
      toast({
        title: "Success",
        description: "Room deleted successfully.",
      });
      return true;
    } catch (error) {
      console.error("Unexpected error deleting room:", error);
      toast({
        title: "Error deleting room",
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
        if (!lines[i].trim()) continue;
        
        const data = lines[i].split(',');
        if (data.length !== headers.length) {
          console.error(`Line ${i} has incorrect number of columns`);
          errorCount++;
          continue;
        }
        
        try {
          const roomData: Record<string, any> = {};
          headers.forEach((header, index) => {
            roomData[header] = data[index].trim();
          });
          
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
          
          const { data: existingRooms, error: queryError } = await supabase
            .from('rooms')
            .select('id')
            .eq('name', name)
            .eq('building_id', buildingId);
            
          if (queryError) throw queryError;
          
          if (existingRooms && existingRooms.length > 0) {
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
            
            await supabase
              .from('room_availability')
              .insert({
                room_id: existingRooms[0].id,
                is_available: isAvailable,
                updated_by: '00000000-0000-0000-0000-000000000000',
              });
              
            updateCount++;
          } else {
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
              await supabase
                .from('room_availability')
                .insert({
                  room_id: newRoom[0].id,
                  is_available: isAvailable,
                  updated_by: '00000000-0000-0000-0000-000000000000',
                });
            }
            
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing line ${i}:`, error);
          errorCount++;
        }
      }
      
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

      const csvRows = [
        ['name', 'type', 'floor', 'buildingId', 'buildingName', 'capacity', 'status'].join(',')
      ];
      
      data.forEach(room => {
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
    deleteRoom,
    handleRoomCsvUpload,
    exportRoomsToCsv,
    isUploading
  };
};
