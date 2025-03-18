
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Navbar from '@/components/layout/Navbar';
import { Building, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Simplified room and building types for the component
interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
  isAvailable: boolean;
  floor: number;
  buildingId: string;
}

interface BuildingWithFloors {
  id: string;
  name: string;
  floors: number[];
  roomCount: number;
}

const Rooms = () => {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Fetch buildings and rooms data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, we're just checking localStorage for any saved data
        const savedBuildings = localStorage.getItem('buildings');
        const savedRooms = localStorage.getItem('rooms');
        
        if (savedBuildings) {
          const parsedBuildings = JSON.parse(savedBuildings);
          setBuildings(parsedBuildings);
          if (parsedBuildings.length > 0) {
            setSelectedBuilding(parsedBuildings[0].id);
          }
        } else {
          // Default empty state
          setBuildings([]);
        }

        if (savedRooms) {
          setRooms(JSON.parse(savedRooms));
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error loading data",
          description: "Could not load buildings and rooms data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter rooms for the selected building
  const buildingRooms = rooms.filter(room => room.buildingId === selectedBuilding);
  
  // Group rooms by floor
  const roomsByFloor = buildingRooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  // Get the floors for the selected building
  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);
  const floors = selectedBuildingData?.floors || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Campus Rooms</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading rooms data...</p>
          </div>
        ) : buildings.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Buildings Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no buildings in the system. Admin users can add buildings and rooms.
            </p>
          </div>
        ) : (
          <Tabs 
            defaultValue={selectedBuilding} 
            onValueChange={setSelectedBuilding} 
            className="w-full"
          >
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
                {floors.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg">
                    <p className="text-muted-foreground">No floors found for this building.</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 gap-6">
                      {floors.map((floor) => {
                        const floorRooms = roomsByFloor[floor] || [];
                        return (
                          <div key={floor} className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2">
                              {floor === 1 ? "First" : 
                               floor === 2 ? "Second" :
                               floor === 3 ? "Third" : "Fourth"} Floor
                            </h2>
                            
                            {floorRooms.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">
                                No rooms found on this floor.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {floorRooms.map((room) => (
                                  <Card 
                                    key={room.id} 
                                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                                      room.isAvailable ? 'border-green-500 border-2' : 'border-red-300 border'
                                    }`}
                                  >
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Rooms;
