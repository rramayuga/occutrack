
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Room } from '@/lib/types';

interface RoomCardProps {
  room: Room;
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  canModifyRooms, 
  onToggleAvailability 
}) => {
  return (
    <Card 
      key={room.id} 
      className={`
        ${canModifyRooms ? 'cursor-pointer' : ''}
        hover:shadow-md transition-shadow
        ${room.isAvailable ? 'border-green-500 border-2' : 'border-red-300 border'}
      `}
      onClick={() => canModifyRooms && onToggleAvailability(room.id)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{room.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span>{room.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={room.isAvailable ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
              {room.isAvailable ? "Available" : "Occupied"}
            </span>
          </div>
          {canModifyRooms && (
            <div className="mt-2 pt-2 border-t text-center text-xs text-muted-foreground">
              Click to {room.isAvailable ? 'occupy' : 'free up'} this room
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
