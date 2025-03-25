
import React, { useState, useEffect } from 'react';
import { useRoomsManagement } from '@/hooks/useRoomsManagement';
import { useBuildings } from '@/hooks/useBuildings';
import { useRooms } from '@/hooks/useRooms';
import { Room, BuildingWithFloors } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import BuildingForm, { BuildingFormValues } from '@/components/admin/BuildingForm';
import RoomForm, { RoomFormValues } from '@/components/admin/RoomForm';
import { Download, Upload } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/layout/Navbar';
import BuildingsList from '@/components/admin/BuildingsList';
import RoomTable from '@/components/admin/RoomTable';
import RoomFilters from '@/components/admin/RoomFilters';

const RoomManagement = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [roomFilter, setRoomFilter] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("buildings");
  
  const [buildingsWithFloors, setBuildingsWithFloors] = useState<BuildingWithFloors[]>([]);
  
  const { addRoom, handleRoomCsvUpload, exportRoomsToCsv, isUploading } = useRoomsManagement();
  const { buildings: originalBuildings, loading: buildingsLoading, addBuilding } = useBuildings();
  const { rooms: fetchedRooms, loading: roomsLoading } = useRooms();
  const { toast } = useToast();
  
  useEffect(() => {
    const convertedBuildings: BuildingWithFloors[] = originalBuildings.map(building => {
      // Create a numeric array of floors from the floors count
      const floorArray = Array.from({ length: building.floors || 0 }, (_, i) => i + 1);
      
      return {
        ...building,
        floors: floorArray
      };
    });
    setBuildingsWithFloors(convertedBuildings);
  }, [originalBuildings]);
  
  useEffect(() => {
    setRooms(fetchedRooms);
    
    // Update room counts for buildings
    const roomCounts: {[key: string]: number} = {};
    fetchedRooms.forEach(room => {
      roomCounts[room.buildingId] = (roomCounts[room.buildingId] || 0) + 1;
    });
    
    const updatedBuildings = buildingsWithFloors.map(building => ({
      ...building,
      roomCount: roomCounts[building.id] || 0
    }));
    
    setBuildingsWithFloors(updatedBuildings);
  }, [fetchedRooms]);
  
  useEffect(() => {
    filterRooms();
  }, [selectedBuilding, selectedFloor, roomFilter, rooms]);
  
  const getFloorsForSelectedBuilding = () => {
    if (!selectedBuilding) return [];
    const building = buildingsWithFloors.find(b => b.id === selectedBuilding);
    if (!building || !building.floors) return [];
    return building.floors;
  };

  const handleAddRoom = async (formData: RoomFormValues) => {
    const roomData: Omit<Room, 'id'> = {
      name: formData.name,
      type: formData.type,
      floor: formData.floor,
      buildingId: formData.buildingId,
      isAvailable: formData.isAvailable,
      capacity: 30,
      status: formData.isAvailable ? 'available' : 'occupied'
    };
    
    const success = await addRoom(roomData);
    if (success) {
      setIsAddingRoom(false);
      toast({
        title: "Room added",
        description: "The room has been successfully added."
      });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
        
      if (error) throw error;
      
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      toast({
        title: "Room deleted",
        description: "The room has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Could not delete room. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      const { data: buildingRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .eq('building_id', buildingId);
        
      if (roomsError) throw roomsError;
      
      if (buildingRooms && buildingRooms.length > 0) {
        toast({
          title: "Cannot delete building",
          description: "Please delete all rooms in this building first.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId);
        
      if (error) throw error;
      
      toast({
        title: "Building deleted",
        description: "The building has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting building:', error);
      toast({
        title: "Error",
        description: "Could not delete building. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await handleRoomCsvUpload(csvFile);
      setIsImportDialogOpen(false);
      setCsvFile(null);
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

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
  };

  const handleAddBuildingSubmit = async (data: BuildingFormValues) => {
    if (await addBuilding(data.name, data.floorCount, data.location)) {
      setIsAddingBuilding(false);
    }
  };

  const handleViewRooms = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setActiveTab("rooms");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <h1 className="text-2xl font-bold">Room Management</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="buildings" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={() => setIsAddingBuilding(true)}>Add Building</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportRoomsToCsv}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Import CSV
                </Button>
              </div>
            </div>

            <BuildingsList 
              buildings={buildingsWithFloors}
              onViewRooms={handleViewRooms}
              onDeleteBuilding={handleDeleteBuilding}
              isLoading={buildingsLoading}
            />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <RoomFilters 
                buildings={buildingsWithFloors}
                selectedBuilding={selectedBuilding}
                setSelectedBuilding={setSelectedBuilding}
                selectedFloor={selectedFloor}
                setSelectedFloor={setSelectedFloor}
                roomFilter={roomFilter}
                setRoomFilter={setRoomFilter}
                getFloorsForSelectedBuilding={getFloorsForSelectedBuilding}
              />

              <Button
                onClick={() => setIsAddingRoom(true)}
                disabled={!selectedBuilding}
              >
                Add Room
              </Button>
            </div>

            <RoomTable 
              rooms={filteredRooms}
              onDeleteRoom={handleDeleteRoom}
              isLoading={roomsLoading}
              selectedBuilding={selectedBuilding}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isAddingBuilding} onOpenChange={setIsAddingBuilding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Building</DialogTitle>
              <DialogDescription>
                Enter the details for the new building.
              </DialogDescription>
            </DialogHeader>
            <BuildingForm 
              onSubmit={handleAddBuildingSubmit} 
              onCancel={() => setIsAddingBuilding(false)} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Room</DialogTitle>
              <DialogDescription>
                Enter the details for the new room.
              </DialogDescription>
            </DialogHeader>
            <RoomForm 
              onSubmit={handleAddRoom} 
              onCancel={() => setIsAddingRoom(false)} 
              defaultBuildingId={selectedBuilding}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Rooms from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import or update rooms. The file should include columns for name, type, floor, buildingId, and isAvailable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                type="file" 
                accept=".csv" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setCsvFile(e.target.files[0]);
                  }
                }} 
              />
              <p className="text-xs text-muted-foreground">
                Existing rooms with matching names in the same building will be updated.
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setCsvFile(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCsvImport} 
                disabled={isUploading || !csvFile}
              >
                {isUploading ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoomManagement;
