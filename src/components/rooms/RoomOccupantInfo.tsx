
import React from 'react';

interface RoomOccupantInfoProps {
  isAvailable: boolean;
  occupiedBy: string | null;
}

const RoomOccupantInfo: React.FC<RoomOccupantInfoProps> = ({ 
  isAvailable, 
  occupiedBy 
}) => {
  if (isAvailable) return null;
  
  return (
    <p className="text-xs mt-1 font-medium text-muted-foreground">
      {occupiedBy ? `Occupied by: ${occupiedBy}` : 'Currently occupied'}
    </p>
  );
};

export default RoomOccupantInfo;
