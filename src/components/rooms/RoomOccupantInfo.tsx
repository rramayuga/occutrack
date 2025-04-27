
import React from 'react';
import { RoomStatus } from '@/lib/types';

interface RoomOccupantInfoProps {
  occupiedBy: string | null;
  status: RoomStatus;
}

const RoomOccupantInfo: React.FC<RoomOccupantInfoProps> = ({ 
  occupiedBy,
  status
}) => {
  // If room is available, don't show any status
  if (status === 'available') return null;
  
  // If room is under maintenance, display maintenance message
  if (status === 'maintenance') {
    return (
      <p className="text-xs mt-1 font-medium text-muted-foreground">
        This room is currently under maintenance
      </p>
    );
  }
  
  // Show occupant information if available, otherwise just show "Currently occupied"
  return (
    <p className="text-xs mt-1 font-medium text-muted-foreground">
      {occupiedBy ? `Occupied by: ${occupiedBy}` : 'Currently occupied'}
    </p>
  );
};

export default RoomOccupantInfo;
