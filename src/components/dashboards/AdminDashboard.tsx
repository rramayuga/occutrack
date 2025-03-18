import React, { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Users, Building, Settings, Plus, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  user: User;
}

interface Building {
  id: string;
  name: string;
  rooms: number;
  utilization: string;
  createdBy: string;
}

const buildingFormSchema = z.object({
  name: z.string().min(2, { message: "Building name must be at least 2 characters." }),
  floors: z.string().transform(val => parseInt(val, 10)),
});

const roomFormSchema = z.object({
  name: z.string().min(2, { message: "Room name must be at least 2 characters." }),
  type: z.string().min(2, { message: "Room type must be at least 2 characters." }),
  floor: z.string().transform(val => parseInt(val, 10)),
  buildingId: z.string().min(1, { message: "Please select a building." }),
});

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const buildingForm = useForm({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: "",
      floors: "1",
    },
  });
  
  const roomForm = useForm({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "",
      floor: "1",
      buildingId: "",
    },
  });
  
  useEffect(() => {
    // Load buildings from localStorage
    const fetchBuildings = async () => {
      try {
        console.log("Fetching buildings for admin:", user.id);
        
        // Load from localStorage
        const savedBuildings = localStorage.getItem('buildings');
        let adminBuildings = [];
        
        if (savedBuildings) {
          const allBuildings = JSON.parse(savedBuildings);
          console.log("All buildings from localStorage:", allBuildings);
          
          // Filter buildings to show only those created by the current admin
          adminBuildings = allBuildings.filter((building: Building) => building.createdBy === user.id);
          console.log("Admin buildings after filtering:", adminBuildings);
        } 
        
        // If no buildings found for this admin, set empty array
        if (adminBuildings.length === 0) {
          console.log("No buildings found for this admin, creating default set");
          adminBuildings = [
            { id: '1', name: 'Main Building', rooms: 0, utilization: '0%', createdBy: user.id },
            { id: '2', name: 'Science Complex', rooms: 0, utilization: '0%', createdBy: user.id }
          ];
          
          // Save these default buildings to localStorage
          const savedAllBuildings = localStorage.getItem('buildings');
          let allBuildings = adminBuildings;
          
          if (savedAllBuildings) {
            const existingBuildings = JSON.parse(savedAllBuildings);
            // Keep buildings from other admins
            const otherBuildings = existingBuildings.filter((b: Building) => b.createdBy !== user.id);
            allBuildings = [...otherBuildings, ...adminBuildings];
          }
          
          localStorage.setItem('buildings', JSON.stringify(allBuildings));
          console.log("Saved default buildings to localStorage");
          
          // Also create buildings with floors data
          const buildingsWithFloors = [
            { id: '1', name: 'Main Building', floors: [1, 2, 3], roomCount: 0 },
            { id: '2', name: 'Science Complex', floors: [1, 2], roomCount: 0 }
          ];
          
          localStorage.setItem('buildingsWithFloors', JSON.stringify(buildingsWithFloors));
          console.log("Saved default buildingsWithFloors to localStorage");
        }
        
        setBuildings(adminBuildings);
      } catch (error) {
        console.error("Error fetching buildings:", error);
        toast({
          title: "Error",
          description: "Failed to load buildings data.",
          variant: "destructive"
        });
      }
    };
    
    fetchBuildings();
  }, [user.id, toast]);

  const onAddBuilding = (data: any) => {
    console.log("Adding new building:", data);
    
    const newBuilding = {
      id: Date.now().toString(),
      name: data.name,
      rooms: 0,
      utilization: '0%',
      createdBy: user.id
    };
    
    const updatedBuildings = [...buildings, newBuilding];
    setBuildings(updatedBuildings);
    
    // Update localStorage with all buildings (including ones from other admins)
    const savedBuildings = localStorage.getItem('buildings');
    let allBuildings = [];
    if (savedBuildings) {
      allBuildings = JSON.parse(savedBuildings);
      // Filter out buildings from other admins
      const otherBuildings = allBuildings.filter((b: Building) => b.createdBy !== user.id);
      // Add all buildings from this admin
      allBuildings = [...otherBuildings, ...updatedBuildings];
    } else {
      allBuildings = [newBuilding];
    }
    localStorage.setItem('buildings', JSON.stringify(allBuildings));
    console.log("All buildings saved to localStorage:", allBuildings);
    
    // Create floors array: [1, 2, ..., data.floors]
    const floors = Array.from({ length: data.floors }, (_, i) => i + 1);
    
    // Create building with floors in a format for rooms page
    const buildingsWithFloors = localStorage.getItem('buildingsWithFloors');
    let buildingsFloorData = [];
    if (buildingsWithFloors) {
      buildingsFloorData = JSON.parse(buildingsWithFloors);
    }
    
    const newBuildingWithFloors = {
      id: newBuilding.id,
      name: newBuilding.name,
      floors: floors,
      roomCount: 0
    };
    
    buildingsFloorData = [...buildingsFloorData.filter((b: any) => b.id !== newBuilding.id), newBuildingWithFloors];
    localStorage.setItem('buildingsWithFloors', JSON.stringify(buildingsFloorData));
    console.log("Buildings with floors saved to localStorage:", buildingsFloorData);
    
    toast({
      title: "Building added",
      description: `${data.name} has been added successfully.`
    });
    
    buildingForm.reset();
    setIsBuildingDialogOpen(false);
  };

  const onAddRoom = (data: any) => {
    console.log("Adding new room:", data);
    
    // Add room to rooms data
    const savedRooms = localStorage.getItem('rooms');
    let rooms = [];
    if (savedRooms) {
      rooms = JSON.parse(savedRooms);
    }
    
    const newRoom = {
      id: Date.now().toString(),
      name: data.name,
      type: data.type,
      isAvailable: true,
      floor: data.floor,
      buildingId: data.buildingId
    };
    
    rooms = [...rooms, newRoom];
    localStorage.setItem('rooms', JSON.stringify(rooms));
    console.log("All rooms saved to localStorage:", rooms);
    
    // Update building room count
    const updatedBuildings = buildings.map(building => {
      if (building.id === data.buildingId) {
        return {
          ...building,
          rooms: building.rooms + 1
        };
      }
      return building;
    });
    
    setBuildings(updatedBuildings);
    
    // Update all buildings in localStorage
    const savedBuildings = localStorage.getItem('buildings');
    if (savedBuildings) {
      const allBuildings = JSON.parse(savedBuildings);
      const updatedAllBuildings = allBuildings.map((b: Building) => {
        if (b.id === data.buildingId) {
          return {
            ...b,
            rooms: b.rooms + 1
          };
        }
        return b;
      });
      localStorage.setItem('buildings', JSON.stringify(updatedAllBuildings));
      console.log("Updated buildings with new room count:", updatedAllBuildings);
    }
    
    // Also update buildings with floors data
    const buildingsWithFloors = localStorage.getItem('buildingsWithFloors');
    if (buildingsWithFloors) {
      const buildingsFloorData = JSON.parse(buildingsWithFloors);
      const updatedBuildingsFloorData = buildingsFloorData.map((b: any) => {
        if (b.id === data.buildingId) {
          return {
            ...b,
            roomCount: b.roomCount + 1
          };
        }
        return b;
      });
      localStorage.setItem('buildingsWithFloors', JSON.stringify(updatedBuildingsFloorData));
      console.log("Updated buildingsWithFloors with new room count:", updatedBuildingsFloorData);
    }
    
    toast({
      title: "Room added",
      description: `${data.name} has been added to the selected building.`
    });
    
    roomForm.reset();
    setIsRoomDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          <Button onClick={() => setIsRoomDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add New Room
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">{buildings.length}</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">
                {buildings.reduce((total, building) => total + building.rooms, 0)}
              </span>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faculty Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">56</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">78%</span>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="buildings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Buildings Tab */}
        <TabsContent value="buildings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Building Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search buildings..." 
              />
              <Button variant="outline" size="sm" onClick={() => setIsBuildingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{building.name}</CardTitle>
                  <CardDescription>{building.rooms} rooms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization:</span>
                      <span>{building.utilization}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">View</Button>
                      <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {buildings.length === 0 && (
              <div className="col-span-3 text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">No buildings available. Add a building to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Faculty Tab */}
        <TabsContent value="faculty" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Faculty Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search faculty..." 
              />
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border">
            <div className="grid grid-cols-5 font-medium p-4 border-b">
              <div>Name</div>
              <div>Department</div>
              <div>Email</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            {[
              { name: 'Dr. Sarah Johnson', department: 'Computer Science', email: 'sjohnson@edu.com', status: 'Active' },
              { name: 'Prof. Michael Chen', department: 'Physics', email: 'mchen@edu.com', status: 'Active' },
              { name: 'Dr. Emily Williams', department: 'Biology', email: 'ewilliams@edu.com', status: 'On Leave' },
              { name: 'Prof. James Smith', department: 'Mathematics', email: 'jsmith@edu.com', status: 'Active' }
            ].map((faculty, i) => (
              <div key={i} className="grid grid-cols-5 p-4 border-b last:border-0 items-center">
                <div>{faculty.name}</div>
                <div>{faculty.department}</div>
                <div className="text-sm">{faculty.email}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    faculty.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {faculty.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">System Analytics</h2>
            <div>
              <Button variant="outline" size="sm">
                Download Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Utilization</CardTitle>
                <CardDescription>Average usage per building</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Room utilization chart goes here</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Faculty Activity</CardTitle>
                <CardDescription>Teaching hours per department</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Faculty activity chart goes here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Building Dialog */}
      <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
          </DialogHeader>
          <Form {...buildingForm}>
            <form onSubmit={buildingForm.handleSubmit(onAddBuilding)} className="space-y-4">
              <FormField
                control={buildingForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter building name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={buildingForm.control}
                name="floors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Floors</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter number of floors" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Building</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Select a building</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name/Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 101, Lab 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roomForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Classroom, Lab, Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roomForm.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Floor number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Room</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
