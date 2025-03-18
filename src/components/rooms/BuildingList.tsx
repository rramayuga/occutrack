
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building } from 'lucide-react';
import { BuildingWithFloors } from '@/lib/types';

interface BuildingListProps {
  buildings: BuildingWithFloors[];
  selectedBuilding: string;
  onBuildingChange: (buildingId: string) => void;
}

const BuildingList: React.FC<BuildingListProps> = ({ 
  buildings, 
  selectedBuilding, 
  onBuildingChange 
}) => {
  return (
    <TabsList className="mb-4 flex overflow-x-auto pb-2 justify-start">
      {buildings.map((building) => (
        <TabsTrigger 
          key={building.id} 
          value={building.id}
          className={`min-w-max px-4 py-2 ${building.id === selectedBuilding ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => onBuildingChange(building.id)}
        >
          <Building className="w-4 h-4 mr-2" />
          {building.name}
        </TabsTrigger>
      ))}
      
      {buildings.length === 0 && (
        <div className="text-muted-foreground p-2">
          No buildings available
        </div>
      )}
    </TabsList>
  );
};

export default BuildingList;
