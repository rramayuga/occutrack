
import React from 'react';
import RoomCard from './RoomCard';
import { Room } from '@/lib/types';

interface FloorRoomsProps {
  floor: number;
  rooms: Room[];
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
  onSelectRoom?: (room: Room) => void;
}

const FloorRooms: React.FC<FloorRoomsProps> = ({ 
  floor, 
  rooms, 
  canModifyRooms, 
  onToggleAvailability,
  onSelectRoom
}) => {
  const floorLabel = 
    floor === 1 ? "First" : 
    floor === 2 ? "Second" :
    floor === 3 ? "Third" : 
    floor === 4 ? "Fourth" : `${floor}th`;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2">
        {floorLabel} Floor
      </h2>
      
      {rooms.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No rooms found on this floor.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              canModifyRooms={canModifyRooms}
              onToggleAvailability={onToggleAvailability}
              onSelectRoom={onSelectRoom ? () => onSelectRoom(room) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FloorRooms;
