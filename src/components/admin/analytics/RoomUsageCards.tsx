
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomUsageData } from '../types/room';

interface RoomUsageCardsProps {
  data: RoomUsageData[];
}

const RoomUsageCards: React.FC<RoomUsageCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map((room, index) => (
        <Card key={index} className="flex flex-col h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{room.roomName}</h4>
                <p className="text-sm text-muted-foreground">{room.buildingName} - Floor {room.floor}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                room.status === 'available' ? 'bg-green-100 text-green-800' :
                room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {room.status === 'available' ? 'Available' : 
                 room.status === 'occupied' ? 'Occupied' : 
                 'Maintenance'}
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Usage Hours</p>
                <p className="text-lg font-semibold">{room.utilizationHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reservations</p>
                <p className="text-lg font-semibold">{room.reservations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomUsageCards;
