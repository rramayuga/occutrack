
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, BuildingWithFloors } from '@/lib/types';

interface RoomFiltersProps {
  buildings: BuildingWithFloors[];
  selectedBuilding: string;
  setSelectedBuilding: (buildingId: string) => void;
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
  roomFilter: string;
  setRoomFilter: (filter: string) => void;
  getFloorsForSelectedBuilding: () => number[];
}

const RoomFilters: React.FC<RoomFiltersProps> = ({
  buildings,
  selectedBuilding,
  setSelectedBuilding,
  selectedFloor,
  setSelectedFloor,
  roomFilter,
  setRoomFilter,
  getFloorsForSelectedBuilding
}) => {
  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor(null); // Reset floor when building changes
  };

  const handleFloorChange = (floor: string) => {
    setSelectedFloor(floor === "all" ? null : parseInt(floor));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 flex-1">
      <div className="flex-1">
        <Label htmlFor="buildingSelect">Building</Label>
        <Select
          value={selectedBuilding}
          onValueChange={handleBuildingChange}
        >
          <SelectTrigger id="buildingSelect">
            <SelectValue placeholder="Select a building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="floorSelect">Floor</Label>
        <Select
          value={selectedFloor?.toString() || "all"}
          onValueChange={handleFloorChange}
          disabled={!selectedBuilding}
        >
          <SelectTrigger id="floorSelect">
            <SelectValue placeholder="All floors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floors</SelectItem>
            {getFloorsForSelectedBuilding().map((floor) => (
              <SelectItem key={floor} value={floor.toString()}>
                Floor {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="roomSearch">Search</Label>
        <Input
          id="roomSearch"
          placeholder="Search rooms..."
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        />
      </div>
    </div>
  );
};

export default RoomFilters;
