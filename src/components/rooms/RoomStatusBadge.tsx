
import React from 'react';
import { Badge } from "@/components/ui/badge";

// Define the possible room statuses
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

interface RoomStatusBadgeProps {
  status?: RoomStatus;
  isAvailable?: boolean; // Keep for backward compatibility
}

const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status, isAvailable }) => {
  // If the new status prop is not provided, fall back to the old isAvailable logic
  const effectiveStatus = status || (isAvailable ? 'available' : 'occupied');
  
  const getVariant = () => {
    switch (effectiveStatus) {
      case 'available':
        return "outline";
      case 'occupied':
        return "destructive";
      case 'maintenance':
        return "secondary";
      default:
        return "outline";
    }
  };
  
  const getLabel = () => {
    switch (effectiveStatus) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <Badge 
      variant={getVariant()}
      className="text-xs"
    >
      {getLabel()}
    </Badge>
  );
};

export default RoomStatusBadge;
