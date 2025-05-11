
// Add or update the RoomUsageData type for the analytics
export interface RoomUsageData {
  roomId?: string;  // Added to match usage in code
  roomName: string;
  roomType?: string;
  status?: string;
  buildingName: string;
  floor: number;
  reservations: number;
  utilizationHours: number;
  utilizationRate?: number;
}
