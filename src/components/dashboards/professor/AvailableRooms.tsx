
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BuildingWithFloors, Room } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { sortRoomsByName } from '@/lib/utils';

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: BuildingWithFloors[];
  onReserveClick: (buildingId: string, roomId: string, buildingName: string, roomName: string) => void;
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ 
  rooms, 
  buildings,
  onReserveClick 
}) => {
  // Get available rooms and sort them by name
  const availableRooms = sortRoomsByName(
    rooms.filter(room => room.isAvailable && room.status === 'available')
  ).slice(0, 3);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Availability</CardTitle>
        <CardDescription>Currently available rooms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableRooms.length > 0 ? (
            availableRooms.map((room) => {
              const building = buildings.find(b => b.id === room.buildingId);
              const buildingName = building?.name || 'Unknown Building';
              
              return (
                <div key={room.id} className="pb-4 border-b last:border-0 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">{room.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {buildingName} • Type: {room.type}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onReserveClick(room.buildingId, room.id, buildingName, room.name)}
                  >
                    Reserve
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-4">No available rooms found.</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <a href="/rooms" className="text-sm text-primary hover:underline">View all rooms</a>
      </CardFooter>
    </Card>
  );
};
