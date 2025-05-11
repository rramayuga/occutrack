
// Add or update the RoomUsageData type for the analytics
export interface RoomUsageData {
  roomName: string;
  roomType?: string;  // Made optional to match actual usage
  status?: string;
  buildingName: string;
  floor: number;
  reservations: number;
  utilizationHours: number;
  utilizationRate?: number;  // Optional for backward compatibility
}
