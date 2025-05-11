
import React from 'react';
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
  if (!building) return null;

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
          onSubmit={onSubmit}
          onCancel={onClose}
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBuildingDialog;
