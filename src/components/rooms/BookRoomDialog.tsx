
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReservations } from '@/hooks/useReservations';
import { useRooms } from '@/hooks/useRooms';
import { ReservationFormValues } from '@/lib/types';
import { BookRoomForm } from './BookRoomForm';
import { useAuth } from '@/lib/auth';

interface BookRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingComplete?: () => void;
}

const BookRoomDialog: React.FC<BookRoomDialogProps> = ({
  open,
  onOpenChange,
  onBookingComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { buildings, rooms } = useRooms();
  const { createReservation } = useReservations();
  const { user } = useAuth();
  
  // Check if the user has permission to book rooms
  const canBookRooms = user && ['faculty', 'admin', 'superadmin'].includes(user.role);
  
  useEffect(() => {
    // Log authentication state when the component mounts or user changes
    console.log("BookRoomDialog - Auth state:", { 
      user, 
      canBookRooms, 
      userRole: user?.role 
    });
  }, [user]);
  
  const handleSubmit = async (values: ReservationFormValues) => {
    if (!canBookRooms) {
      console.error("User doesn't have permission to book rooms");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // We need to ensure roomId is available for the createReservation function
      if (!values.roomId) {
        console.error("Room ID is required");
        return;
      }
      
      await createReservation(values, values.roomId);
      onOpenChange(false);
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (error) {
      console.error("Failed to book room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
          <DialogDescription>
            Fill in the details to book a room for your class or meeting.
          </DialogDescription>
        </DialogHeader>
        
        {canBookRooms ? (
          <BookRoomForm 
            rooms={rooms}
            buildings={buildings}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <p>You need faculty permissions to book rooms.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookRoomDialog;
