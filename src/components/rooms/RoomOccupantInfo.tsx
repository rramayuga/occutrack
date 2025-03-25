
import React from 'react';
import { RoomStatus } from '@/lib/types';

interface RoomOccupantInfoProps {
  isAvailable: boolean;
  occupiedBy: string | null;
  status?: RoomStatus;
}

const RoomOccupantInfo: React.FC<RoomOccupantInfoProps> = ({ 
  isAvailable, 
  occupiedBy,
  status
}) => {
  // If room is available and not under maintenance, don't show any status
  if (isAvailable && status !== 'maintenance') return null;
  
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
