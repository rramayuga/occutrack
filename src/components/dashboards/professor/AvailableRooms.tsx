
import React from 'react';
import { Building, Room } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomStatusBadge } from "@/components/rooms/RoomStatusBadge";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: Building[];
  onReserveClick: (buildingId: string, roomId: string, buildingName: string, roomName: string) => void;
  connectionError?: boolean;
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ 
  rooms, 
  buildings, 
  onReserveClick,
  connectionError = false
}) => {
  // Filter for available rooms
  const availableRooms = rooms.filter(room => room.status === 'available');

  // Group rooms by building
  const roomsByBuilding: Record<string, Room[]> = {};
  availableRooms.forEach(room => {
    if (!roomsByBuilding[room.buildingId]) {
      roomsByBuilding[room.buildingId] = [];
    }
    roomsByBuilding[room.buildingId].push(room);
  });

  // Get building names
  const getBuildingName = (id: string) => {
    const building = buildings.find(b => b.id === id);
    return building ? building.name : 'Unknown Building';
  };

  return (
    <div className="col-span-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Rooms</span>
            {connectionError && (
              <div className="flex items-center text-sm text-destructive font-normal">
                <WifiOff className="h-3 w-3 mr-1" />
                <span>Connection Error</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(roomsByBuilding).length === 0 ? (
            <div className="text-center py-6">
              <p>{connectionError ? "Unable to fetch available rooms due to connection issues." : "No available rooms at this time."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(roomsByBuilding).map((buildingId) => (
                <div key={buildingId}>
                  <h3 className="font-medium mb-2">{getBuildingName(buildingId)}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomsByBuilding[buildingId].map((room) => (
                      <Card key={room.id} className="border shadow-sm">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{room.name}</h4>
                            <RoomStatusBadge status={room.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                          <p className="text-sm text-muted-foreground">Capacity: {room.capacity}</p>
                        </CardContent>
                        <CardFooter className="pt-0 pb-4">
                          <Button 
                            onClick={() => onReserveClick(buildingId, room.id, getBuildingName(buildingId), room.name)} 
                            size="sm" 
                            className="w-full"
                            disabled={connectionError}
                          >
                            {connectionError ? "Offline" : "Reserve"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
