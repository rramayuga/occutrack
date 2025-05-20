
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuildingWithFloors } from '@/lib/types';
import { Search, Plus } from 'lucide-react';

interface BuildingsTabProps {
  buildings: BuildingWithFloors[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddBuilding: () => void;
  filteredBuildings: BuildingWithFloors[];
  handleViewBuilding: (id: string) => void;
  handleEditBuilding: (building: BuildingWithFloors) => void;
  handleDeleteBuilding: (building: BuildingWithFloors) => void;
}

const BuildingsTab: React.FC<BuildingsTabProps> = ({
  buildings,
  loading,
  searchTerm,
  setSearchTerm,
  onAddBuilding,
  filteredBuildings,
  handleViewBuilding,
  handleEditBuilding,
  handleDeleteBuilding
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buildings..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={onAddBuilding}>
          <Plus className="h-4 w-4 mr-2" /> Add Building
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted p-6 rounded-md animate-pulse">
              <div className="h-6 w-3/4 bg-muted-foreground/20 rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="h-4 w-1/3 bg-muted-foreground/20 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredBuildings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((building) => (
            <div key={building.id} className="bg-card shadow-sm p-6 rounded-md border">
              <h3 className="text-lg font-semibold mb-2">{building.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{building.location || 'No location set'}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {building.floors?.length || 0} Floors • {building.roomCount || 0} Rooms
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewBuilding(building.id)}
                >
                  View Rooms
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteBuilding(building)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">No buildings found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or add a new building.</p>
        </div>
      )}
    </div>
  );
};

export default BuildingsTab;
