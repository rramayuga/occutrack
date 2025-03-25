
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building } from '@/lib/types';

interface BuildingsListProps {
  buildings: Building[];
  onViewRooms: (buildingId: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
  isLoading: boolean;
}

const BuildingsList: React.FC<BuildingsListProps> = ({ 
  buildings, 
  onViewRooms, 
  onDeleteBuilding,
  isLoading 
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {buildings.map((building) => (
        <Card key={building.id} className="p-4">
          <h3 className="text-lg font-semibold">{building.name}</h3>
          <p className="text-sm text-muted-foreground">
            Location: {building.location || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            Floors: {building.floors}
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
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDeleteBuilding(building.id)}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BuildingsList;
