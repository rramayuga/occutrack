
import React, { useMemo } from 'react';
import { Building, Room } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvailableRoomsProps {
  rooms: Room[];
  buildings: Building[];
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({ 
  rooms, 
  buildings
}) => {
  // Filter to only available rooms
  const availableRooms = useMemo(() => 
    rooms.filter(room => room.isAvailable && room.status === 'available')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [rooms]
  );

  // Group rooms by building
  const roomsByBuilding = useMemo(() => {
    const grouped: Record<string, Room[]> = {};
    
    availableRooms.forEach(room => {
      if (!grouped[room.buildingId]) {
        grouped[room.buildingId] = [];
      }
      grouped[room.buildingId].push(room);
    });
    
    return grouped;
  }, [availableRooms]);

  // Get building names
  const buildingDetails = useMemo(() => {
    const details: Record<string, { name: string, count: number }> = {};
    
    buildings.forEach(building => {
      const buildingRooms = roomsByBuilding[building.id] || [];
      details[building.id] = {
        name: building.name,
        count: buildingRooms.length
      };
    });
    
    return details;
  }, [buildings, roomsByBuilding]);

  // Get buildings with available rooms
  const buildingsWithRooms = useMemo(() => 
    buildings.filter(building => roomsByBuilding[building.id]?.length > 0),
    [buildings, roomsByBuilding]
  );
  
  // Default to first building with available rooms
  const defaultBuildingId = buildingsWithRooms[0]?.id || '';

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">
          Available Rooms
          <Badge variant="secondary" className="ml-2">
            {availableRooms.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableRooms.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No available rooms found.</p>
          </div>
        ) : (
          <Tabs defaultValue={defaultBuildingId} className="w-full">
            <TabsList className="w-full mb-4 overflow-x-auto flex flex-nowrap">
              {buildingsWithRooms.map((building) => (
                <TabsTrigger 
                  key={building.id} 
                  value={building.id}
                  className="whitespace-nowrap"
                >
                  {buildingDetails[building.id]?.name} ({buildingDetails[building.id]?.count})
                </TabsTrigger>
              ))}
            </TabsList>
            {buildingsWithRooms.map((building) => (
              <TabsContent key={building.id} value={building.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roomsByBuilding[building.id]?.map((room) => (
                    <Card key={room.id} className="bg-gray-50 border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-medium">{room.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {buildingDetails[room.buildingId]?.name} | Floor {room.floor}
                            </p>
                            <Badge 
                              className="mt-2" 
                              variant="outline"
                            >
                              {room.capacity} Seats
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
