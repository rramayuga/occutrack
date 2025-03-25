
import React from 'react';
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search } from 'lucide-react';
import { Building } from '@/lib/types';

interface RoomFiltersProps {
  buildings: Building[];
  selectedBuilding: string;
  setSelectedBuilding: (id: string) => void;
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
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <Select
        value={selectedBuilding}
        onValueChange={setSelectedBuilding}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Building" />
        </SelectTrigger>
        <SelectContent>
          {buildings.map((building) => (
            <SelectItem key={building.id} value={building.id}>
              {building.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedFloor?.toString() || ""}
        onValueChange={(value) => setSelectedFloor(value ? parseInt(value) : null)}
        disabled={!selectedBuilding}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Floors</SelectItem>
          {getFloorsForSelectedBuilding().map((floor) => (
            <SelectItem key={floor} value={floor.toString()}>
              Floor {floor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter rooms..."
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="pl-8 w-full"
        />
      </div>
    </div>
  );
};

export default RoomFilters;
