
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
            floorCount: building.floors?.length || 0,
            location: building.location || ''
          }}
          onSubmit={(data) => {
            // Log the submission data
            console.log('Submitting edit building form:', data);
            onSubmit({
              ...data,
              // Ensure floorCount is properly passed as a number
              floorCount: typeof data.floorCount === 'string' ? 
                parseInt(data.floorCount, 10) : data.floorCount
            });
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBuildingDialog;
