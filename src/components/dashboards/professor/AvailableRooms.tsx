
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, Room } from '@/lib/types';

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: Building[];
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ 
  rooms, 
  buildings
}) => {
  const availableRooms = rooms.filter(room => room.isAvailable && room.status !== 'maintenance');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Availability</CardTitle>
        <CardDescription>Currently available rooms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableRooms.slice(0, 3).length > 0 ? (
            availableRooms.slice(0, 3).map((room) => {
              const building = buildings.find(b => b.id === room.buildingId);
              return (
                <div key={room.id} className="pb-4 border-b last:border-0">
                  <h4 className="text-sm font-medium">{room.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {building?.name || 'Unknown Building'} • Type: {room.type}
                  </p>
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
