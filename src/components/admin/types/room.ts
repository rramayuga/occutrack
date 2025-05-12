
export interface RoomUsageData {
  roomName: string;
  reservations: number;
  utilizationHours: number;
  status: string;
  buildingName: string;
  floor: number;
}

export interface RoomAnalyticsFiltersProps {
  selectedBuilding: string;
  setSelectedBuilding: (buildingId: string) => void;
  selectedFloor: string;
  setSelectedFloor: (floor: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  buildings: { id: string; name: string }[];
  floors: number[];
}
