
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";

// Simplified room and building types for the component
interface Room {
  id: string;
  name: string;
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

interface Booking {
  id: string;
  building: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  faculty: string;
}

const Rooms = () => {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch buildings and rooms data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch buildings data
        const buildingsWithFloors = localStorage.getItem('buildingsWithFloors');
        if (buildingsWithFloors) {
          const parsedBuildings = JSON.parse(buildingsWithFloors);
          console.log("Fetched buildings:", parsedBuildings);
          setBuildings(parsedBuildings);
          if (parsedBuildings.length > 0) {
            setSelectedBuilding(parsedBuildings[0].id);
          }
        } else {
          console.log("No buildings found in localStorage");
          setBuildings([]);
        }

        // Fetch rooms data
        const savedRooms = localStorage.getItem('rooms');
        if (savedRooms) {
          const parsedRooms = JSON.parse(savedRooms);
          console.log("Fetched rooms:", parsedRooms);
          setRooms(parsedRooms);
        } else {
          console.log("No rooms found in localStorage");
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

    // Check for room status updates every minute
    const intervalId = setInterval(() => {
      updateRoomStatusBasedOnBookings();
    }, 60000);
    
    // Run the check immediately on load
    setTimeout(() => {
      updateRoomStatusBasedOnBookings();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [toast, user]);

  // Update room status based on bookings
  const updateRoomStatusBasedOnBookings = () => {
    if (!user) return;
    
    // Get all bookings from localStorage
    const allBookingsStr = localStorage.getItem('allBookings');
    if (!allBookingsStr) return;
    
    try {
      const allBookings: Booking[] = JSON.parse(allBookingsStr);
      const now = new Date();
      
      // Check which bookings are currently active
      const updatedRooms = [...rooms];
      let roomsUpdated = false;
      
      allBookings.forEach((booking: Booking) => {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        
        // Only check bookings for today
        if (bookingDate.getDate() === today.getDate() && 
            bookingDate.getMonth() === today.getMonth() && 
            bookingDate.getFullYear() === today.getFullYear()) {
          
          const startTimeParts = booking.startTime.split(':');
          const endTimeParts = booking.endTime.split(':');
          
          const startDateTime = new Date(bookingDate);
          startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);
          
          const endDateTime = new Date(bookingDate);
          endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
          
          // Check if current time is between start and end times
          const isActive = now >= startDateTime && now < endDateTime;
          
          // Update the room status in local state
          updatedRooms.forEach((room, index) => {
            if (room.name === booking.roomNumber) {
              // If room status needs to change
              if ((isActive && room.isAvailable) || (!isActive && !room.isAvailable)) {
                updatedRooms[index] = { ...room, isAvailable: !isActive };
                roomsUpdated = true;
                console.log(`Room ${room.name} status updated to ${!isActive ? 'available' : 'occupied'}`);
              }
            }
          });
        }
      });
      
      if (roomsUpdated) {
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
      }
    } catch (error) {
      console.error("Error updating room status:", error);
    }
  };

  // Toggle room availability (only for faculty)
  const handleToggleRoomAvailability = (roomId: string) => {
    // Only allow faculty to toggle room availability
    if (user?.role !== 'faculty') {
      if (user?.role === 'student') {
        toast({
          title: "Access Denied",
          description: "Students cannot change room availability.",
          variant: "destructive"
        });
      }
      return;
    }

    // Update the room's availability status
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        // Toggle the availability
        const updatedRoom = { ...room, isAvailable: !room.isAvailable };
        
        // Show a toast notification
        toast({
          title: updatedRoom.isAvailable ? "Room Available" : "Room Occupied",
          description: `${updatedRoom.name} is now ${updatedRoom.isAvailable ? 'available' : 'occupied'}.`,
          variant: updatedRoom.isAvailable ? "default" : "destructive"
        });
        
        return updatedRoom;
      }
      return room;
    });
    
    // Update state and localStorage
    setRooms(updatedRooms);
    localStorage.setItem('rooms', JSON.stringify(updatedRooms));
  };

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

  // Determine if the current user can modify room availability
  const canModifyRooms = user?.role === 'faculty';

  console.log("Rendering Rooms component with:", { 
    buildingsCount: buildings.length, 
    roomsCount: rooms.length,
    selectedBuilding,
    floors
  });

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
                                    className={`
                                      ${canModifyRooms ? 'cursor-pointer' : ''}
                                      hover:shadow-md transition-shadow
                                      ${room.isAvailable ? 'border-green-500 border-2' : 'border-red-300 border'}
                                    `}
                                    onClick={() => canModifyRooms && handleToggleRoomAvailability(room.id)}
                                  >
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">{room.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-sm space-y-1">
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
                                        {canModifyRooms && (
                                          <div className="mt-2 pt-2 border-t text-center text-xs text-muted-foreground">
                                            Click to {room.isAvailable ? 'occupy' : 'free up'} this room
                                          </div>
                                        )}
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
