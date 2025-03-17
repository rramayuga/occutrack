
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/layout/Navbar';
import { Building } from "lucide-react";

// Mock data for buildings and rooms
const buildings = [
  {
    id: "main",
    name: "Main Building",
    floors: [
      { 
        number: 1, 
        rooms: Array.from({ length: 30 }, (_, i) => ({
          id: `101-${i+1}`,
          name: `Room ${101 + i}`,
          capacity: Math.floor(Math.random() * 30) + 10,
          isAvailable: Math.random() > 0.3,
          type: Math.random() > 0.5 ? "Classroom" : "Lab"
        }))
      },
      { 
        number: 2, 
        rooms: Array.from({ length: 29 }, (_, i) => ({
          id: `202-${i+1}`,
          name: `Room ${202 + i}`,
          capacity: Math.floor(Math.random() * 30) + 10,
          isAvailable: Math.random() > 0.3,
          type: Math.random() > 0.5 ? "Classroom" : "Lab"
        }))
      },
      { 
        number: 3, 
        rooms: Array.from({ length: 29 }, (_, i) => ({
          id: `303-${i+1}`,
          name: `Room ${303 + i}`,
          capacity: Math.floor(Math.random() * 30) + 10,
          isAvailable: Math.random() > 0.3,
          type: Math.random() > 0.5 ? "Classroom" : "Lab"
        }))
      },
      { 
        number: 4, 
        rooms: Array.from({ length: 29 }, (_, i) => ({
          id: `404-${i+1}`,
          name: `Room ${404 + i}`,
          capacity: Math.floor(Math.random() * 30) + 10,
          isAvailable: Math.random() > 0.3,
          type: Math.random() > 0.6 ? "Classroom" : "Lab"
        }))
      },
    ]
  },
  {
    id: "is-a",
    name: "IS Building A",
    floors: [
      { 
        number: 1, 
        rooms: Array.from({ length: 15 }, (_, i) => ({
          id: `is-a-101-${i+1}`,
          name: `Room A${101 + i}`,
          capacity: Math.floor(Math.random() * 25) + 15,
          isAvailable: Math.random() > 0.4,
          type: "Computer Lab"
        }))
      },
      { 
        number: 2, 
        rooms: Array.from({ length: 15 }, (_, i) => ({
          id: `is-a-201-${i+1}`,
          name: `Room A${201 + i}`,
          capacity: Math.floor(Math.random() * 25) + 15,
          isAvailable: Math.random() > 0.4,
          type: "Computer Lab"
        }))
      },
    ]
  },
  {
    id: "is-b",
    name: "IS Building B",
    floors: [
      { 
        number: 1, 
        rooms: Array.from({ length: 10 }, (_, i) => ({
          id: `is-b-101-${i+1}`,
          name: `Room B${101 + i}`,
          capacity: Math.floor(Math.random() * 20) + 20,
          isAvailable: Math.random() > 0.2,
          type: "Lecture Hall"
        }))
      },
    ]
  }
];

const Rooms = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0].id);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Campus Rooms</h1>
        </div>

        <Tabs defaultValue={buildings[0].id} onValueChange={setSelectedBuilding} className="w-full">
          <TabsList className="mb-4 flex overflow-x-auto pb-2 justify-start">
            {buildings.map((building) => (
              <TabsTrigger 
                key={building.id} 
                value={building.id}
                className="min-w-max px-4 py-2"
              >
                <Building className="w-4 h-4 mr-2" />
                {building.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {buildings.map((building) => (
            <TabsContent key={building.id} value={building.id}>
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-6">
                  {building.floors.map((floor) => (
                    <div key={floor.number} className="space-y-4">
                      <h2 className="text-xl font-semibold border-b pb-2">
                        {floor.number === 1 ? "First" : 
                         floor.number === 2 ? "Second" :
                         floor.number === 3 ? "Third" : "Fourth"} Floor
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {floor.rooms.map((room) => (
                          <Card key={room.id} className={`cursor-pointer hover:shadow-md transition-shadow ${room.isAvailable ? 'border-green-500 border-2' : 'border-red-300 border'}`}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{room.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Capacity:</span>
                                  <span>{room.capacity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span>{room.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className={room.isAvailable ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                                    {room.isAvailable ? "Available" : "Occupied"}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Rooms;
