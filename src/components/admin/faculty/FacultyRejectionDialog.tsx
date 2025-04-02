
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FacultyMember } from '@/lib/types';

interface FacultyRejectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFaculty: FacultyMember | null;
  notes: string;
  setNotes: (notes: string) => void;
  onConfirmReject: () => void;
}

const FacultyRejectionDialog: React.FC<FacultyRejectionDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedFaculty,
  notes,
  setNotes,
  onConfirmReject
}) => {
  const getDialogTitle = () => {
    if (!selectedFaculty) return 'Reject Faculty Request';
    return selectedFaculty.status === 'rejected' 
      ? 'Reject Faculty Request' 
      : selectedFaculty.status === 'approved' 
        ? 'Change Faculty Status' 
        : 'Reject Faculty Request';
  };

  const getInputLabel = () => {
    if (!selectedFaculty) return 'Rejection Reason (Optional)';
    return selectedFaculty.status === 'approved' 
      ? 'Reason for Status Change (Optional)'
      : 'Rejection Reason (Optional)';
  };

  const getConfirmText = () => {
    if (!selectedFaculty) return 'Confirm Rejection';
    return selectedFaculty.status === 'approved' 
      ? 'Confirm Change'
      : 'Confirm Rejection';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Please provide a reason for {selectedFaculty?.status === 'approved' ? 'changing' : 'rejecting'} this faculty request. This information will be helpful for the user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            {getInputLabel()}
          </label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Insufficient credentials, duplicate request, etc."
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmReject}>
            {getConfirmText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyRejectionDialog;
