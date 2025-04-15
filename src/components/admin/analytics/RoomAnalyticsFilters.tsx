
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoomAnalyticsFiltersProps {
  selectedBuilding: string;
  setSelectedBuilding: (value: string) => void;
  selectedFloor: string;
  setSelectedFloor: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  buildings: { id: string; name: string }[];
  floors: number[];
}

const RoomAnalyticsFilters: React.FC<RoomAnalyticsFiltersProps> = ({
  selectedBuilding,
  setSelectedBuilding,
  selectedFloor,
  setSelectedFloor,
  statusFilter,
  setStatusFilter,
  buildings,
  floors,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
        <SelectTrigger>
          <SelectValue placeholder="Select building" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Buildings</SelectItem>
          {buildings.map(building => (
            <SelectItem key={building.id} value={building.name}>
              {building.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedFloor} onValueChange={setSelectedFloor}>
        <SelectTrigger>
          <SelectValue placeholder="Select floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Floors</SelectItem>
          {floors.map(floor => (
            <SelectItem key={floor} value={floor.toString()}>
              Floor {floor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="occupied">Occupied</SelectItem>
          <SelectItem value="maintenance">Under Maintenance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomAnalyticsFilters;
