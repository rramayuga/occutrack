
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface RoomStatusBadgeProps {
  isAvailable: boolean;
}

const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ isAvailable }) => {
  return (
    <Badge 
      variant={isAvailable ? "outline" : "destructive"}
      className="text-xs"
    >
      {isAvailable ? 'Available' : 'Occupied'}
    </Badge>
  );
};

export default RoomStatusBadge;
