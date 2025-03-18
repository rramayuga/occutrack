
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock } from 'lucide-react';
import { Room } from '@/lib/types';

export interface RoomCardProps {
  room: Room;
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
  onSelectRoom?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  canModifyRooms, 
  onToggleAvailability,
  onSelectRoom
}) => {
  const handleCardClick = () => {
    if (onSelectRoom) {
      onSelectRoom();
    }
  };

  const handleToggleAvailability = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggle button is clicked
    onToggleAvailability(room.id);
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onSelectRoom ? 'cursor-pointer' : ''} ${room.isAvailable ? '' : 'border-red-200'}`}
      onClick={onSelectRoom ? handleCardClick : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{room.name}</CardTitle>
          <Badge 
            variant={room.isAvailable ? "outline" : "destructive"}
            className="text-xs"
          >
            {room.isAvailable ? 'Available' : 'Occupied'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>{room.type}</div>
        </div>
      </CardContent>
      <CardFooter className="pt-1 justify-between">
        {canModifyRooms ? (
          <Button 
            variant={room.isAvailable ? "outline" : "default"}
            size="sm"
            className="w-full"
            onClick={handleToggleAvailability}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {room.isAvailable ? 'Mark as Occupied' : 'Mark as Available'}
          </Button>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            {!room.isAvailable ? 'Currently in use' : 'Ready for use'}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
