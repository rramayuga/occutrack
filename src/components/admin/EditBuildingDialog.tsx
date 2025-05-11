
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BuildingForm, { BuildingFormValues } from './BuildingForm';
import { BuildingWithFloors } from '@/lib/types';

interface EditBuildingDialogProps {
  building: BuildingWithFloors | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BuildingFormValues) => void;
}

const EditBuildingDialog: React.FC<EditBuildingDialogProps> = ({
  building,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!building) return null;

  const handleSubmit = async (data: BuildingFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Building</DialogTitle>
        </DialogHeader>
        <BuildingForm 
          defaultValues={{
            name: building.name,
            floorCount: building.floors.length,
            location: building.location || ''
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBuildingDialog;
