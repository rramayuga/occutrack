
import React, { useState, useEffect } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useBuildings } from '@/hooks/useBuildings';
import { BuildingWithFloors, Room } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import RoomStatusBadge from "@/components/rooms/RoomStatusBadge";
import { useRoomsManagement } from '@/hooks/useRoomsManagement';

const RoomManagement = () => {
  // States for room management
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [roomFilter, setRoomFilter] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  
  // Hooks
  const { addRoom, handleRoomCsvUpload, exportRoomsToCsv, isUploading } = useRoomsManagement();
  const { buildings, loading: buildingsLoading, addBuilding: handleAddBuilding } = useBuildings();
  const { toast } = useToast();
  
  // Fetch rooms based on the selected building and floor
  useEffect(() => {
    // In a real app, this would be a fetch from the API
    // For now we'll simulate with static data
    const mockRooms: Room[] = [
      {
        id: "1",
        name: "Room 101",
        type: "Classroom",
        isAvailable: true,
        floor: 1,
        buildingId: "b1",
        capacity: 30
      },
      {
        id: "2",
        name: "Room 102",
        type: "Lab",
        isAvailable: false,
        floor: 1,
        buildingId: "b1",
        capacity: 20
      },
      {
        id: "3",
        name: "Room 201",
        type: "Lecture Hall",
        isAvailable: true,
        floor: 2,
        buildingId: "b1",
        capacity: 100
      }
    ];
    
    setRooms(mockRooms);
  }, []);
  
  // Filter rooms whenever dependencies change
  useEffect(() => {
    filterRooms();
  }, [selectedBuilding, selectedFloor, roomFilter, rooms]);
  
  // Get unique floors for the selected building
  const getFloorsForSelectedBuilding = () => {
    if (!selectedBuilding) return [];
    const building = buildings.find(b => b.id === selectedBuilding);
    if (!building) return [];
    return building.floors;
  };

  // Handle adding a new room
  const handleAddRoom = async (roomData: Omit<Room, 'id'>) => {
    const success = await addRoom(roomData);
    if (success) {
      setIsAddingRoom(false);
      // In a real app, we would refresh the rooms list here
      toast({
        title: "Room added",
        description: "The room has been successfully added."
      });
    }
  };

  // Handle deleting a room
  const handleDeleteRoom = (roomId: string) => {
    // In a real app, this would call an API
    setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    toast({
      title: "Room deleted",
      description: "The room has been successfully deleted."
    });
  };

  // Handle deleting a building
  const handleDeleteBuilding = (buildingId: string) => {
    // In a real app, this would call an API
    toast({
      title: "Building deleted",
      description: "The building has been successfully deleted."
    });
  };

  // Filter rooms based on selected building, floor, and text filter
  const filterRooms = () => {
    let filtered = [...rooms];
    
    if (selectedBuilding) {
      filtered = filtered.filter(room => room.buildingId === selectedBuilding);
    }
    
    if (selectedFloor !== null) {
      filtered = filtered.filter(room => room.floor === selectedFloor);
    }
    
    if (roomFilter) {
      const lowerCaseFilter = roomFilter.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(lowerCaseFilter) || 
        room.type.toLowerCase().includes(lowerCaseFilter)
      );
    }
    
    setFilteredRooms(filtered);
    return filtered;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Room Management</h1>

      <Tabs defaultValue="buildings">
        <TabsList>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        {/* Buildings Tab */}
        <TabsContent value="buildings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddingBuilding(true)}>Add Building</Button>
          </div>

          {buildingsLoading ? (
            <p>Loading buildings...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map(building => (
                <Card key={building.id}>
                  <CardHeader>
                    <CardTitle>{building.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rooms:</span>
                        <span>{building.roomCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Utilization:</span>
                        <span>{building.utilization || '0%'}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedBuilding(building.id);
                            const tabsElement = document.querySelector('[data-value="rooms"]');
                            if (tabsElement) {
                              // Using the modern API instead of .click()
                              tabsElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            }
                          }}
                        >
                          View Rooms
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDeleteBuilding(building.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-2">
              <Select
                value={selectedBuilding}
                onValueChange={setSelectedBuilding}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedFloor?.toString() || ""}
                onValueChange={(value) => setSelectedFloor(value ? parseInt(value) : null)}
                disabled={!selectedBuilding}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Floors</SelectItem>
                  {getFloorsForSelectedBuilding().map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter rooms..."
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full md:w-auto"
              />
            </div>

            <Button
              onClick={() => setIsAddingRoom(true)}
              disabled={!selectedBuilding}
            >
              Add Room
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.capacity || "N/A"}</TableCell>
                      <TableCell>
                        <RoomStatusBadge isAvailable={room.isAvailable} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No rooms found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Building Dialog */}
      <Dialog open={isAddingBuilding} onOpenChange={setIsAddingBuilding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Building</DialogTitle>
            <DialogDescription>
              Enter the details for the new building.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const floorCount = parseInt(formData.get('floorCount') as string);
            const location = formData.get('location') as string;
            
            if (handleAddBuilding(name, floorCount, location)) {
              setIsAddingBuilding(false);
            }
          }} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Building Name</label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="floorCount" className="text-sm font-medium">Number of Floors</label>
                <Input id="floorCount" name="floorCount" type="number" min="1" defaultValue="1" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium">Location (Optional)</label>
                <Input id="location" name="location" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddingBuilding(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Building</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Enter the details for the new room.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const type = formData.get('type') as string;
            const floor = parseInt(formData.get('floor') as string);
            const capacity = parseInt(formData.get('capacity') as string);
            const isAvailable = formData.get('isAvailable') === 'on';
            
            handleAddRoom({
              name,
              type,
              floor,
              buildingId: selectedBuilding,
              capacity,
              isAvailable
            });
          }} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Room Name</label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">Room Type</label>
                <Select name="type" defaultValue="Classroom">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                    <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                    <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="floor" className="text-sm font-medium">Floor</label>
                <Select name="floor" defaultValue={selectedFloor?.toString() || "1"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFloorsForSelectedBuilding().map((floor) => (
                      <SelectItem key={floor} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="capacity" className="text-sm font-medium">Capacity</label>
                <Input id="capacity" name="capacity" type="number" min="1" defaultValue="30" />
              </div>
              <div className="flex items-center space-x-2">
                <input id="isAvailable" name="isAvailable" type="checkbox" defaultChecked className="rounded" />
                <label htmlFor="isAvailable" className="text-sm font-medium">Available for booking</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddingRoom(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
