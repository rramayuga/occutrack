
import React from 'react';
import { Reservation } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CancelReservationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  reservation: Reservation | null;
  roomName: string;
  onConfirmCancel: () => Promise<void>;
}

const CancelReservationDialog: React.FC<CancelReservationDialogProps> = ({
  open,
  setOpen,
  reservation,
  roomName,
  onConfirmCancel
}) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your reservation for {roomName} on {reservation?.date} from {reservation?.startTime} to {reservation?.endTime}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, Keep It</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmCancel} className="bg-red-500 hover:bg-red-600">
            Yes, Cancel Reservation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelReservationDialog;
