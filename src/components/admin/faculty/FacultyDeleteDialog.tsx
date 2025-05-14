
import React from 'react';
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
import { FacultyMember } from '@/lib/types';

interface FacultyDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFaculty: FacultyMember | null;
  onConfirmDelete: () => void;
}

const FacultyDeleteDialog: React.FC<FacultyDeleteDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedFaculty,
  onConfirmDelete,
}) => {
  if (!selectedFaculty) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Faculty Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedFaculty.name}? This action cannot be undone and will
            permanently remove the user from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FacultyDeleteDialog;
