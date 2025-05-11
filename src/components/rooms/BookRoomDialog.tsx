
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BookRoomForm from './BookRoomForm';

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Classroom</DialogTitle>
          <DialogDescription>
            Enter the details of the room you want to book and the time slot.
          </DialogDescription>
        </DialogHeader>
        
        <BookRoomForm 
          onSuccess={() => {
            onOpenChange(false);
            if (onBookingComplete) onBookingComplete();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BookRoomDialog;
