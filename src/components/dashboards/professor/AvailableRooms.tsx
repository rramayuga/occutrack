
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BuildingWithFloors, Room } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update available rooms list when rooms prop changes
  useEffect(() => {
    updateAvailableRooms();
  }, [rooms]);

  // Filter available rooms
  const updateAvailableRooms = () => {
    const filtered = rooms.filter(room => 
      room.isAvailable && room.status === 'available'
    ).slice(0, 3);
    
    setAvailableRooms(filtered);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    updateAvailableRooms();
    
    // Visual feedback for refresh action
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Room Availability</CardTitle>
          <CardDescription>Currently available rooms</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
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
