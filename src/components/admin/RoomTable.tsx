
import React, { useState } from 'react';
import { Room } from '@/lib/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import RoomStatusBadge from "@/components/rooms/RoomStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoomTableProps {
  rooms: Room[];
  onDeleteRoom: (roomId: string) => void;
  isLoading: boolean;
  selectedBuilding: string;
}

const RoomTable: React.FC<RoomTableProps> = ({ 
  rooms, 
  onDeleteRoom, 
  isLoading, 
  selectedBuilding 
}) => {
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  
  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
  };
  
  const handleConfirmDelete = () => {
    if (roomToDelete) {
      onDeleteRoom(roomToDelete.id);
      setRoomToDelete(null);
    }
  };
  
  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading rooms...
                </TableCell>
              </TableRow>
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>{room.capacity || "N/A"}</TableCell>
                  <TableCell>
                    <RoomStatusBadge 
                      status={room.status} 
                      isAvailable={room.isAvailable} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(room)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {selectedBuilding ? "No rooms found in this building." : "Select a building to view rooms."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={roomToDelete !== null} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the room "{roomToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoomTable;
