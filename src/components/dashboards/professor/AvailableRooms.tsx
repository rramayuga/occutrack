
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Room } from '@/lib/types';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: Building[];
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ rooms, buildings }) => {
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const { getAvailableRooms } = useRoomAvailability();

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      // Get rooms that are currently available
      const available = await getAvailableRooms();
      setAvailableRooms(available.slice(0, 5)); // Show up to 5 available rooms
    };

    fetchAvailableRooms();
    
    // Refresh every minute
    const intervalId = setInterval(fetchAvailableRooms, 60000);
    return () => clearInterval(intervalId);
  }, [rooms, getAvailableRooms]);

  // Helper function to get building name from building id
  const getBuildingName = (buildingId: string): string => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : 'Unknown Building';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Available Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {availableRooms.length === 0 ? (
          <p className="text-muted-foreground text-sm">No rooms currently available.</p>
        ) : (
          <div className="space-y-3">
            {availableRooms.map((room) => (
              <div 
                key={room.id} 
                className="flex justify-between items-center p-2 rounded-md border hover:bg-accent/10"
              >
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getBuildingName(room.buildingId)}, Floor {room.floor}
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Available
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Visit Rooms page to view all available rooms
        </div>
      </CardContent>
    </Card>
  );
};
