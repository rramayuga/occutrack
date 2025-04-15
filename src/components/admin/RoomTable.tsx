
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
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
  };
  
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      setIsDeleting(true);
      await onDeleteRoom(roomToDelete.id);
      toast({
        title: "Room deleted",
        description: `${roomToDelete.name} has been successfully deleted.`
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
                      disabled={isDeleting}
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
              This action cannot be undone and will remove all associated reservations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoomTable;
