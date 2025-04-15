
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BuildingForm from '../BuildingForm';
import RoomForm from '../RoomForm';
import EditBuildingDialog from '../EditBuildingDialog';
import DeleteBuildingDialog from '../DeleteBuildingDialog';
import { BuildingWithFloors } from '@/lib/types';

interface BuildingManagementDialogsProps {
  isBuildingDialogOpen: boolean;
  setIsBuildingDialogOpen: (open: boolean) => void;
  isRoomDialogOpen: boolean;
  setIsRoomDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  selectedBuilding: BuildingWithFloors | null;
  setSelectedBuilding: (building: BuildingWithFloors | null) => void;
  onBuildingSubmit: (data: any) => Promise<void>;
  onRoomSubmit: (data: any) => Promise<void>;
  onEditBuildingSubmit: (data: any) => Promise<void>;
  onDeleteBuilding: () => Promise<void>;
}

const BuildingManagementDialogs: React.FC<BuildingManagementDialogsProps> = ({
  isBuildingDialogOpen,
  setIsBuildingDialogOpen,
  isRoomDialogOpen,
  setIsRoomDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  selectedBuilding,
  setSelectedBuilding,
  onBuildingSubmit,
  onRoomSubmit,
  onEditBuildingSubmit,
  onDeleteBuilding,
}) => {
  return (
    <>
      <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
          </DialogHeader>
          <BuildingForm 
            onSubmit={onBuildingSubmit} 
            onCancel={() => setIsBuildingDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomForm 
            onSubmit={onRoomSubmit} 
            onCancel={() => setIsRoomDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <EditBuildingDialog
        building={selectedBuilding}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedBuilding(null);
        }}
        onSubmit={onEditBuildingSubmit}
      />

      <DeleteBuildingDialog
        building={selectedBuilding}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedBuilding(null);
        }}
        onConfirm={onDeleteBuilding}
      />
    </>
  );
};

export default BuildingManagementDialogs;
