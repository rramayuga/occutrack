
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { RoomStatus } from '@/lib/types';

interface RoomStatusBadgeProps {
  status: RoomStatus;
}

const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'maintenance':
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
          Under Maintenance
        </Badge>
      );
    case 'occupied':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
          Occupied
        </Badge>
      );
    case 'available':
    default:
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
          Available
        </Badge>
      );
  }
};

export default RoomStatusBadge;
