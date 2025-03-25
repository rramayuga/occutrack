
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuildingWithFloors } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BuildingForm, { BuildingFormValues } from './BuildingForm';
import { Pencil, Trash2 } from 'lucide-react';

interface BuildingsListProps {
  buildings: BuildingWithFloors[];
  onViewRooms: (buildingId: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
  onUpdateBuilding?: (id: string, data: BuildingFormValues) => void;
  isLoading: boolean;
}

const BuildingsList: React.FC<BuildingsListProps> = ({ 
  buildings, 
  onViewRooms, 
  onDeleteBuilding,
  onUpdateBuilding,
  isLoading 
}) => {
  const [editingBuilding, setEditingBuilding] = useState<BuildingWithFloors | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingWithFloors | null>(null);

  if (isLoading) {
    return <p>Loading buildings...</p>;
  }

  if (buildings.length === 0) {
    return (
      <div className="col-span-3 text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No buildings available. Add a building to get started.</p>
      </div>
    );
  }

  const handleEditClick = (building: BuildingWithFloors) => {
    setEditingBuilding(building);
  };

  const handleDeleteClick = (building: BuildingWithFloors) => {
    setDeletingBuilding(building);
  };

  const handleUpdateSubmit = (data: BuildingFormValues) => {
    if (editingBuilding && onUpdateBuilding) {
      onUpdateBuilding(editingBuilding.id, data);
      setEditingBuilding(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingBuilding) {
      onDeleteBuilding(deletingBuilding.id);
      setDeletingBuilding(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((building) => (
          <Card key={building.id} className="p-4">
            <h3 className="text-lg font-semibold">{building.name}</h3>
            <p className="text-sm text-muted-foreground">
              Location: {building.location || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              Floors: {building.floors.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Rooms: {building.roomCount || 0}
            </p>
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewRooms(building.id)}
              >
                View Rooms
              </Button>
              {onUpdateBuilding && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditClick(building)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteClick(building)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Building Dialog */}
      {editingBuilding && (
        <Dialog open={!!editingBuilding} onOpenChange={(open) => !open && setEditingBuilding(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Building</DialogTitle>
            </DialogHeader>
            <BuildingForm 
              defaultValues={{
                name: editingBuilding.name,
                floorCount: editingBuilding.floors.length,
                location: editingBuilding.location || ''
              }}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setEditingBuilding(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBuilding} onOpenChange={(open) => !open && setDeletingBuilding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the building "{deletingBuilding?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBuilding(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BuildingsList;
