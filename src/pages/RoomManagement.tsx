
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, FormField, FormItem, FormLabel, 
  FormControl, FormMessage, FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Edit, Trash, FileInput, Download, 
  Upload, Save, Search, Building
} from 'lucide-react';

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

interface RoomFormValues {
  id?: string;
  name: string;
  capacity: number;
  type: string;
  isAvailable: boolean;
  floor: number;
  buildingId: string;
}

interface BuildingFormValues {
  id?: string;
  name: string;
  floorCount: number;
}

const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState<string>("buildings");
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentBuilding, setCurrentBuilding] = useState<BuildingWithFloors | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Room form setup
  const roomForm = useForm<RoomFormValues>({
    defaultValues: {
      name: '',
      capacity: 20,
      type: 'Classroom',
      isAvailable: true,
      floor: 1,
      buildingId: ''
    }
  });

  // Building form setup
  const buildingForm = useForm<BuildingFormValues>({
    defaultValues: {
      name: '',
      floorCount: 1
    }
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load buildings and rooms from localStorage
  const loadData = () => {
    try {
      const savedBuildings = localStorage.getItem('buildings');
      const savedRooms = localStorage.getItem('rooms');
      
      if (savedBuildings) {
        setBuildings(JSON.parse(savedBuildings));
      }

      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load saved data.",
        variant: "destructive"
      });
    }
  };

  // Save data to localStorage
  const saveData = (newBuildings: BuildingWithFloors[], newRooms: Room[]) => {
    try {
      localStorage.setItem('buildings', JSON.stringify(newBuildings));
      localStorage.setItem('rooms', JSON.stringify(newRooms));
      toast({
        title: "Data saved",
        description: "Building and room data has been updated.",
      });
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error saving data",
        description: "Could not save data.",
        variant: "destructive"
      });
    }
  };

  // Reset and open room dialog
  const openAddRoomDialog = () => {
    roomForm.reset({
      name: '',
      capacity: 20,
      type: 'Classroom',
      isAvailable: true,
      floor: 1,
      buildingId: buildings.length > 0 ? buildings[0].id : ''
    });
    setCurrentRoom(null);
    setIsRoomDialogOpen(true);
  };

  // Reset and open building dialog
  const openAddBuildingDialog = () => {
    buildingForm.reset({
      name: '',
      floorCount: 1
    });
    setCurrentBuilding(null);
    setIsBuildingDialogOpen(true);
  };

  // Open edit dialog for a room
  const openEditRoomDialog = (room: Room) => {
    roomForm.reset({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      type: room.type,
      isAvailable: room.isAvailable,
      floor: room.floor,
      buildingId: room.buildingId
    });
    setCurrentRoom(room);
    setIsRoomDialogOpen(true);
  };

  // Open edit dialog for a building
  const openEditBuildingDialog = (building: BuildingWithFloors) => {
    buildingForm.reset({
      id: building.id,
      name: building.name,
      floorCount: building.floors.length
    });
    setCurrentBuilding(building);
    setIsBuildingDialogOpen(true);
  };

  // Handle room form submission
  const onRoomSubmit = (data: RoomFormValues) => {
    try {
      let updatedRooms: Room[];
      
      if (currentRoom) {
        // Editing existing room
        updatedRooms = rooms.map(room => 
          room.id === currentRoom.id 
            ? { ...data, id: currentRoom.id } as Room
            : room
        );
        toast({
          title: "Room updated",
          description: `${data.name} has been updated.`
        });
      } else {
        // Adding new room
        const newRoom: Room = {
          ...data,
          id: `room-${Date.now()}`
        };
        updatedRooms = [...rooms, newRoom];
        toast({
          title: "Room added",
          description: `${data.name} has been added.`
        });
      }
      
      setRooms(updatedRooms);
      saveData(buildings, updatedRooms);
      setIsRoomDialogOpen(false);
    } catch (error) {
      console.error("Error saving room:", error);
      toast({
        title: "Error",
        description: "Failed to save room data.",
        variant: "destructive"
      });
    }
  };

  // Handle building form submission
  const onBuildingSubmit = (data: BuildingFormValues) => {
    try {
      let updatedBuildings: BuildingWithFloors[];
      
      if (currentBuilding) {
        // Editing existing building
        updatedBuildings = buildings.map(building => {
          if (building.id === currentBuilding.id) {
            // Create updated floors array
            const floors = Array.from({ length: data.floorCount }, (_, i) => i + 1);
            return { 
              ...building, 
              name: data.name, 
              floors: floors
            };
          }
          return building;
        });
        
        toast({
          title: "Building updated",
          description: `${data.name} has been updated.`
        });
      } else {
        // Adding new building
        const floors = Array.from({ length: data.floorCount }, (_, i) => i + 1);
        const newBuilding: BuildingWithFloors = {
          id: `building-${Date.now()}`,
          name: data.name,
          floors: floors,
          roomCount: 0
        };
        
        updatedBuildings = [...buildings, newBuilding];
        toast({
          title: "Building added",
          description: `${data.name} has been added.`
        });
      }
      
      setBuildings(updatedBuildings);
      saveData(updatedBuildings, rooms);
      setIsBuildingDialogOpen(false);
    } catch (error) {
      console.error("Error saving building:", error);
      toast({
        title: "Error",
        description: "Failed to save building data.",
        variant: "destructive"
      });
    }
  };

  // Delete a room
  const deleteRoom = (roomId: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        const updatedRooms = rooms.filter(room => room.id !== roomId);
        setRooms(updatedRooms);
        saveData(buildings, updatedRooms);
        toast({
          title: "Room deleted",
          description: "The room has been removed."
        });
      } catch (error) {
        console.error("Error deleting room:", error);
        toast({
          title: "Error",
          description: "Failed to delete room.",
          variant: "destructive"
        });
      }
    }
  };

  // Delete a building
  const deleteBuilding = (buildingId: string) => {
    if (confirm("Are you sure you want to delete this building? All rooms in this building will also be deleted.")) {
      try {
        // Remove the building
        const updatedBuildings = buildings.filter(building => building.id !== buildingId);
        
        // Remove all rooms in the building
        const updatedRooms = rooms.filter(room => room.buildingId !== buildingId);
        
        setBuildings(updatedBuildings);
        setRooms(updatedRooms);
        saveData(updatedBuildings, updatedRooms);
        
        toast({
          title: "Building deleted",
          description: "The building and its rooms have been removed."
        });
      } catch (error) {
        console.error("Error deleting building:", error);
        toast({
          title: "Error",
          description: "Failed to delete building.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle CSV file upload for rooms
  const handleRoomCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Validate headers
        const requiredHeaders = ['name', 'capacity', 'type', 'floor', 'buildingId', 'isAvailable'];
        const hasAllHeaders = requiredHeaders.every(header => 
          headers.includes(header)
        );
        
        if (!hasAllHeaders) {
          throw new Error("CSV file is missing required headers");
        }
        
        // Parse rows
        const newRooms: Room[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(value => value.trim());
          const roomData: any = {};
          
          headers.forEach((header, index) => {
            if (header === 'capacity' || header === 'floor') {
              roomData[header] = parseInt(values[index], 10);
            } else if (header === 'isAvailable') {
              roomData[header] = values[index].toLowerCase() === 'true';
            } else {
              roomData[header] = values[index];
            }
          });
          
          // Validate building exists
          const buildingExists = buildings.some(b => b.id === roomData.buildingId);
          if (!buildingExists) {
            toast({
              title: "Warning",
              description: `Building ID ${roomData.buildingId} not found for room ${roomData.name}`,
              variant: "destructive"
            });
            continue;
          }
          
          newRooms.push({
            id: `room-${Date.now()}-${i}`,
            ...roomData
          });
        }
        
        // Update rooms
        const updatedRooms = [...rooms, ...newRooms];
        setRooms(updatedRooms);
        saveData(buildings, updatedRooms);
        
        toast({
          title: "Import successful",
          description: `Imported ${newRooms.length} rooms from CSV.`
        });
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Import failed",
          description: "Could not process the CSV file. Please check the format.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Import failed",
        description: "Error reading the file.",
        variant: "destructive"
      });
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  // Export rooms to CSV
  const exportRoomsToCsv = () => {
    try {
      const headers = ['id', 'name', 'capacity', 'type', 'floor', 'buildingId', 'isAvailable'];
      const csvContent = [
        headers.join(','),
        ...rooms.map(room => 
          headers.map(header => {
            const value = room[header as keyof Room];
            return String(value);
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'rooms.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Exported ${rooms.length} rooms to CSV.`
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export failed",
        description: "Could not export rooms to CSV.",
        variant: "destructive"
      });
    }
  };

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      room.name.toLowerCase().includes(searchLower) ||
      room.type.toLowerCase().includes(searchLower) ||
      room.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Room Management</h1>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>
          
          {/* Buildings Tab */}
          <TabsContent value="buildings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Buildings</CardTitle>
                    <CardDescription>Manage campus buildings</CardDescription>
                  </div>
                  <Button 
                    onClick={openAddBuildingDialog}
                    className="h-10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Building
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {buildings.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No buildings found. Add your first building to get started.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Floors</TableHead>
                        <TableHead>Room Count</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildings.map(building => {
                        // Count rooms in this building
                        const roomCount = rooms.filter(r => r.buildingId === building.id).length;
                        
                        return (
                          <TableRow key={building.id}>
                            <TableCell className="font-medium">{building.name}</TableCell>
                            <TableCell>{building.floors.length}</TableCell>
                            <TableCell>{roomCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => openEditBuildingDialog(building)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => deleteBuilding(building.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>Manage campus rooms</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search rooms..."
                        className="pl-8 w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={exportRoomsToCsv}
                      disabled={rooms.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <label
                      htmlFor="csv-upload"
                      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background 
                                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                                focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
                                border border-input hover:bg-accent hover:text-accent-foreground 
                                h-10 px-4 py-2 ${isUploading ? 'opacity-50' : ''}`}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={handleRoomCsvUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <Button onClick={openAddRoomDialog} disabled={buildings.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {buildings.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      Please add buildings before adding rooms.
                    </p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? "No rooms match your search criteria." : "No rooms found. Add your first room to get started."}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.map(room => {
                        const building = buildings.find(b => b.id === room.buildingId);
                        return (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium">{room.name}</TableCell>
                            <TableCell>{building?.name || 'Unknown'}</TableCell>
                            <TableCell>{room.floor}</TableCell>
                            <TableCell>{room.type}</TableCell>
                            <TableCell>{room.capacity}</TableCell>
                            <TableCell>
                              <div className={`px-2 py-1 rounded-full text-xs inline-block ${
                                room.isAvailable 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {room.isAvailable ? 'Available' : 'Occupied'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => openEditRoomDialog(room)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => deleteRoom(room.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Room Dialog */}
        <Dialog 
          open={isRoomDialogOpen} 
          onOpenChange={setIsRoomDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentRoom ? "Edit Room" : "Add New Room"}
              </DialogTitle>
              <DialogDescription>
                {currentRoom 
                  ? "Update the room details below." 
                  : "Enter the details for the new room."}
              </DialogDescription>
            </DialogHeader>
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-4">
                <FormField
                  control={roomForm.control}
                  name="name"
                  rules={{ required: "Room name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Room 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="buildingId"
                  rules={{ required: "Building is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a building" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings.map(building => (
                            <SelectItem 
                              key={building.id} 
                              value={building.id}
                            >
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="floor"
                  rules={{ required: "Floor is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a floor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomForm.watch('buildingId') && buildings
                            .find(b => b.id === roomForm.watch('buildingId'))
                            ?.floors.map(floor => (
                              <SelectItem 
                                key={floor} 
                                value={floor.toString()}
                              >
                                {floor === 1 ? "1st Floor" : 
                                 floor === 2 ? "2nd Floor" : 
                                 floor === 3 ? "3rd Floor" : 
                                 `${floor}th Floor`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="type"
                  rules={{ required: "Room type is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Classroom">Classroom</SelectItem>
                          <SelectItem value="Lab">Lab</SelectItem>
                          <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                          <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                          <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="capacity"
                  rules={{ 
                    required: "Capacity is required",
                    min: { value: 1, message: "Capacity must be at least 1" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Available</FormLabel>
                        <FormDescription>
                          Mark this room as available for use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsRoomDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {currentRoom ? "Update Room" : "Save Room"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Building Dialog */}
        <Dialog 
          open={isBuildingDialogOpen} 
          onOpenChange={setIsBuildingDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentBuilding ? "Edit Building" : "Add New Building"}
              </DialogTitle>
              <DialogDescription>
                {currentBuilding 
                  ? "Update the building details below." 
                  : "Enter the details for the new building."}
              </DialogDescription>
            </DialogHeader>
            <Form {...buildingForm}>
              <form onSubmit={buildingForm.handleSubmit(onBuildingSubmit)} className="space-y-4">
                <FormField
                  control={buildingForm.control}
                  name="name"
                  rules={{ required: "Building name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Building" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={buildingForm.control}
                  name="floorCount"
                  rules={{ 
                    required: "Floor count is required",
                    min: { value: 1, message: "Building must have at least 1 floor" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Floors</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the number of floors in this building (max 20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsBuildingDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {currentBuilding ? "Update Building" : "Save Building"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoomManagement;
