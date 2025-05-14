import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Room } from '@/lib/types';

interface AvailableRoomsProps {
  buildings: Building[];
  rooms: Room[];
  onReserveClick: (buildingId: string, roomId: string, buildingName: string, roomName: string) => void;
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ buildings, rooms, onReserveClick }) => {
  // Get only available rooms and sort them by name
  const availableRooms = useMemo(() => {
    const available = rooms.filter(room => room.isAvailable && room.status === 'available');
    
    // Sort rooms by name, handling numeric parts properly
    return available.sort((a, b) => {
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
    });
  }, [rooms]);

  // Create a mapping from room IDs to building names for easier lookup
  const buildingMap = useMemo(() => {
    const map: Record<string, string> = {};
    rooms.forEach(room => {
      const building = buildings.find(b => b.id === room.buildingId);
      if (building) {
        map[room.id] = building.name;
      }
    });
    return map;
  }, [buildings, rooms]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Available Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {availableRooms.length > 0 ? (
            availableRooms.map((room) => (
              <div 
                key={room.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {buildingMap[room.id]}, Floor {room.floor}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {room.type}
                  </Badge>
                </div>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => onReserveClick(
                    room.buildingId,
                    room.id,
                    buildingMap[room.id] || '',
                    room.name
                  )}
                >
                  Reserve
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center p-4">
              <p className="text-muted-foreground">No rooms available at this time.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
