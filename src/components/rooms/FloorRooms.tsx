import React, { memo } from 'react';
import { Room } from '@/lib/types';
import RoomCard from './RoomCard';

interface FloorRoomsProps {
  floor: number;
  rooms: Room[];
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
  refetchRooms: () => Promise<void>;
}

const FloorRooms: React.FC<FloorRoomsProps> = ({ 
  floor, 
  rooms, 
  canModifyRooms, 
  onToggleAvailability,
  refetchRooms
}) => {
  // Sort rooms by name in ascending order - memoize this calculation
  const sortedRooms = React.useMemo(() => 
    [...rooms].sort((a, b) => {
      // Extract numeric part if room names follow a pattern like "Room 101"
      const aMatch = a.name.match(/(\d+)/);
      const bMatch = b.name.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        // If both room names contain numbers, sort numerically
        const aNum = parseInt(aMatch[0], 10);
        const bNum = parseInt(bMatch[0], 10);
        return aNum - bNum;
      }
      
      // Otherwise sort alphabetically
      return a.name.localeCompare(b.name);
    }),
    [rooms]
  );

  return (
    <div>
      <h2 className="text-xl font-medium mb-3">Floor {floor}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedRooms.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-4">
            No rooms on this floor.
          </p>
        ) : (
          sortedRooms.map(room => (
            <RoomCard
              key={`${room.id}-${room.status}`}
              room={room}
              canModifyRooms={canModifyRooms}
              onToggleAvailability={onToggleAvailability}
              refetchRooms={refetchRooms}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(FloorRooms);
