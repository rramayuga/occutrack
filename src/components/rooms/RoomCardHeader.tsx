
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import RoomStatusBadge from './RoomStatusBadge';
import RoomOccupantInfo from './RoomOccupantInfo';
import { RoomStatus } from '@/lib/types';

interface RoomCardHeaderProps {
  name: string;
  occupiedBy: string | null;
  status: RoomStatus;
}

const RoomCardHeader: React.FC<RoomCardHeaderProps> = ({
  name,
  occupiedBy,
  status
}) => {
  return (
    <>
      <div className="flex justify-between items-start">
        <CardTitle className="text-base">{name}</CardTitle>
        <RoomStatusBadge status={status} />
      </div>
      <RoomOccupantInfo 
        occupiedBy={occupiedBy}
        status={status} 
      />
    </>
  );
};

export default RoomCardHeader;
