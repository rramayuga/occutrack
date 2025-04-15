
export interface RoomAnalyticsFilters {
  selectedBuilding: string;
  selectedFloor: number | null;
  statusFilter: string;
  buildings: {
    id: string;
    name: string;
  }[];
  floors: number[];
}

export interface AnalyticsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export interface FilterChangeHandler {
  onBuildingChange: (buildingId: string) => void;
  onFloorChange: (floor: number | null) => void;
  onStatusChange: (status: string) => void;
}
