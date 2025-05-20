
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

  // Calculate the default floor count based on the building's floors array length
  const floorCount = building.floors?.length || 0;
  
  console.log('EditBuildingDialog - Building data:', building);
  console.log('EditBuildingDialog - Floor count:', floorCount);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Building</DialogTitle>
        </DialogHeader>
        <BuildingForm 
          defaultValues={{
            name: building.name,
            floorCount: floorCount,
            location: building.location || ''
          }}
          onSubmit={(data) => {
            // Log the submission data
            console.log('EditBuildingDialog - Submitting data:', data);
            onSubmit(data);
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBuildingDialog;
