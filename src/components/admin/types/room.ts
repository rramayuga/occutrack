
// Add or update the RoomUsageData type for the analytics
export interface RoomUsageData {
  roomId: string;  // Changed from optional to required
  roomName: string;
  roomType?: string;
  status?: string;
  buildingName: string;
  floor: number;
  reservations: number;
  utilizationHours: number;
  utilizationRate?: number;
}
