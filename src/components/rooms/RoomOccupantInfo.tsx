
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
  if (isAvailable && status !== 'maintenance') return null;
  
  if (status === 'maintenance') {
    return (
      <p className="text-xs mt-1 font-medium text-muted-foreground">
        This room is currently under maintenance
      </p>
    );
  }
  
  return (
    <p className="text-xs mt-1 font-medium text-muted-foreground">
      {occupiedBy ? `Occupied by: ${occupiedBy}` : 'Currently occupied'}
    </p>
  );
};

export default RoomOccupantInfo;
