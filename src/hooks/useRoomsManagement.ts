
import { useState } from 'react';
import { Room } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { createMultiSheetCsv, parseMultiSheetCsv } from '@/lib/utils';

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
      console.log("Attempting to delete room with ID:", roomId);
      
      // First check if the room exists
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('id', roomId)
        .single();
        
      if (roomError) {
        console.error("Error fetching room:", roomError);
        toast({
          title: "Error finding room",
          description: "Could not locate the room to delete.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!roomData) {
        toast({
          title: "Room not found",
          description: "The room you're trying to delete doesn't exist.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Found room to delete:", roomData.name);
      
      // Use the delete_room_cascade function to properly delete the room and all related records
      const { data, error } = await supabase
        .rpc('delete_room_cascade', { room_id_param: roomId });
        
      if (error) {
        console.error("Error deleting room:", error);
        toast({
          title: "Error deleting room",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Room deleted successfully");
      toast({
        title: "Success",
        description: `Room "${roomData.name}" deleted successfully.`,
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
      
      // Parse the multi-sheet CSV
      const buildingsWithRooms = parseMultiSheetCsv(text);
      
      if (buildingsWithRooms.length === 0) {
        toast({
          title: "Invalid CSV Format",
          description: "Could not find any building data in the CSV file. Please check the format.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      let totalSuccessCount = 0;
      let totalUpdateCount = 0;
      let totalErrorCount = 0;
      
      // Process each building and its rooms
      for (const buildingData of buildingsWithRooms) {
        const { buildingName, rooms } = buildingData;
        
        // Find the building ID from the name
        const { data: buildingRecord, error: buildingError } = await supabase
          .from('buildings')
          .select('id')
          .eq('name', buildingName)
          .single();
          
        if (buildingError) {
          console.error(`Building "${buildingName}" not found:`, buildingError);
          toast({
            title: "Building Not Found",
            description: `Could not find building "${buildingName}". Skipping these rooms.`,
            variant: "destructive"
          });
          totalErrorCount += rooms.length;
          continue;
        }
        
        const buildingId = buildingRecord.id;
        let buildingSuccessCount = 0;
        let buildingUpdateCount = 0;
        let buildingErrorCount = 0;
        
        // Process each room in this building
        for (const roomData of rooms) {
          try {
            const name = roomData.name;
            const type = roomData.type;
            const floor = parseInt(roomData.floor);
            const capacity = roomData.capacity ? parseInt(roomData.capacity) : 30;
            const status = roomData.status || 'available';
            const isAvailable = status === 'available';
            
            if (!name || !type || isNaN(floor)) {
              console.error(`Invalid room data: ${JSON.stringify(roomData)}`);
              buildingErrorCount++;
              continue;
            }
            
            // Check if room already exists
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
              
              await supabase
                .from('room_availability')
                .insert({
                  room_id: existingRooms[0].id,
                  is_available: isAvailable,
                  updated_by: '00000000-0000-0000-0000-000000000000',
                });
                
              buildingUpdateCount++;
            } else {
              // Add new room
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
              
              buildingSuccessCount++;
            }
          } catch (error) {
            console.error(`Error processing room:`, error);
            buildingErrorCount++;
          }
        }
        
        // Update totals
        totalSuccessCount += buildingSuccessCount;
        totalUpdateCount += buildingUpdateCount;
        totalErrorCount += buildingErrorCount;
        
        // Show toast for this building
        toast({
          title: `Imported ${buildingName}`,
          description: `Added ${buildingSuccessCount} rooms, updated ${buildingUpdateCount} rooms. ${buildingErrorCount} errors occurred.`,
          variant: buildingErrorCount > 0 ? "default" : "default"
        });
      }
      
      // Show final summary toast
      toast({
        title: "CSV Import Complete",
        description: `Successfully added ${totalSuccessCount} rooms, updated ${totalUpdateCount} rooms across ${buildingsWithRooms.length} buildings. ${totalErrorCount} errors occurred.`,
        variant: totalErrorCount > 0 ? "default" : "default"
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
      // First fetch all buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, name')
        .order('name');
      
      if (buildingsError) {
        console.error("Error fetching buildings:", buildingsError);
        toast({
          title: "Error",
          description: "Failed to fetch buildings for export.",
          variant: "destructive"
        });
        return;
      }
      
      if (!buildingsData || buildingsData.length === 0) {
        toast({
          title: "No Buildings",
          description: "No buildings available to export rooms from.",
        });
        return;
      }
      
      // Create a map to store rooms by building
      const buildingsMap = new Map<string, any[]>();
      
      // Initialize map with empty arrays for all buildings
      buildingsData.forEach(building => {
        buildingsMap.set(building.name, []);
      });
      
      // Fetch all rooms with building information
      const { data: roomsData, error: roomsError } = await supabase
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
      
      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        toast({
          title: "Error",
          description: "Failed to fetch rooms for export.",
          variant: "destructive"
        });
        return;
      }
      
      if (!roomsData || roomsData.length === 0) {
        toast({
          title: "No Rooms",
          description: "No rooms available to export.",
        });
        return;
      }
      
      // Organize rooms by building
      roomsData.forEach(room => {
        const roomData = room as any;
        const buildingName = roomData.buildings?.name || '';
        
        if (buildingName && buildingsMap.has(buildingName)) {
          // Add room to its building's array (exclude buildingId and buildingName)
          buildingsMap.get(buildingName)?.push({
            name: roomData.name,
            type: roomData.type,
            floor: roomData.floor,
            capacity: roomData.capacity,
            status: roomData.status || 'available'
          });
        }
      });
      
      // Create multi-sheet CSV file
      const blob = createMultiSheetCsv(buildingsMap);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'rooms_by_building.csv');
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
