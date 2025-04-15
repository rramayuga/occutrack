
import { useState } from 'react';
import { Room } from '@/lib/types';
import { useRoomsManagement } from './useRoomsManagement';
import { useRooms } from './useRooms';
import { useToast } from "./use-toast";

export const useRoomManagementState = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { addRoom, deleteRoom, handleRoomCsvUpload, exportRoomsToCsv, isUploading } = useRoomsManagement();
  const { rooms: fetchedRooms, loading: roomsLoading, refetchRooms } = useRooms();
  const { toast } = useToast();

  const handleAddRoom = async (formData: any) => {
    const roomData: Omit<Room, 'id'> = {
      name: formData.name,
      type: formData.type,
      floor: formData.floor,
      buildingId: formData.buildingId,
      isAvailable: formData.isAvailable,
      capacity: 30,
      status: formData.isAvailable ? 'available' : 'occupied'
    };
    
    const success = await addRoom(roomData);
    if (success) {
      setIsAddingRoom(false);
      toast({
        title: "Room added",
        description: "The room has been successfully added."
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const success = await deleteRoom(roomId);
      
      if (success) {
        const newRooms = rooms.filter(room => room.id !== roomId);
        setRooms(newRooms);
        await refetchRooms();
        
        toast({
          title: "Room deleted",
          description: "The room has been successfully deleted."
        });
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Could not delete room. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await handleRoomCsvUpload(csvFile);
      setIsImportDialogOpen(false);
      setCsvFile(null);
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

  return {
    rooms,
    setRooms,
    isAddingRoom,
    setIsAddingRoom,
    isImportDialogOpen,
    setIsImportDialogOpen,
    csvFile,
    setCsvFile,
    isUploading,
    roomsLoading,
    handleAddRoom,
    handleDeleteRoom,
    handleCsvImport,
    exportRoomsToCsv,
    fetchedRooms
  };
};
