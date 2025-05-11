
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Room, Building } from '@/lib/types';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: Building[];
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ rooms, buildings }) => {
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const { handleToggleRoomAvailability, setupRoomAvailabilitySubscription } = useRoomAvailability();
  
  // Implement the getAvailableRooms function that was missing
  const getAvailableRooms = () => {
    return rooms.filter(room => room.isAvailable && room.status !== 'maintenance');
  };

  useEffect(() => {
    setAvailableRooms(getAvailableRooms());
  }, [rooms]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableRooms.length > 0 ? (
            availableRooms.map(room => {
              const building = buildings.find(b => b.id === room.buildingId);
              return (
                <div key={room.id} className="p-3 border rounded-md">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {building?.name}, Floor {room.floor}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Capacity: {room.capacity || 'N/A'}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">No available rooms at the moment</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
