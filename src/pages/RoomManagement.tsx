import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, Download, Search } from "lucide-react";
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import { useRooms } from '@/hooks/useRooms';
import { useEnhancedRoomsManagement } from '@/hooks/useEnhancedRoomsManagement';
import { Room } from '@/lib/types';
import FloorRooms from '@/components/rooms/FloorRooms';
import RoomForm, { RoomFormValues } from '@/components/admin/RoomForm';

const RoomManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const { 
    buildings, 
    rooms, 
    loading, 
    selectedBuilding, 
    setSelectedBuilding,
    handleToggleRoomAvailability 
  } = useRooms();

  const { 
    addRoom, 
    handleRoomCsvUpload, 
    exportRoomsToCsv,
    isUploading 
  } = useEnhancedRoomsManagement();

  const buildingRooms = rooms.filter(room => {
    const matchesBuilding = room.buildingId === selectedBuilding;
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor;
    const matchesSearch = searchTerm === '' || 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesBuilding && matchesFloor && matchesSearch;
  });
  
  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);
  const floors = selectedBuildingData 
    ? Array.from({ length: selectedBuildingData.floors }, (_, i) => i + 1) 
    : [];

  const handleAddRoom = async (data: RoomFormValues) => {
    const roomData: Omit<Room, 'id'> = {
      name: data.name,
      type: data.type,
      floor: data.floor,
      buildingId: data.buildingId,
      isAvailable: data.isAvailable,
      capacity: data.capacity || 30
    };
    
    const result = await addRoom(roomData);
    if (result) {
      setIsRoomDialogOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (fileToUpload) {
      await handleRoomCsvUpload(fileToUpload);
      setIsUploadDialogOpen(false);
      setFileToUpload(null);
    }
  };

  const canModifyRooms = user?.role === 'admin' || user?.role === 'superadmin';

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Room Management</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportRoomsToCsv}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => setIsRoomDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading rooms data...</p>
          </div>
        ) : buildings.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">No Buildings Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no buildings in the system. Please add a building first.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <Input 
                  placeholder="Search rooms..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <select 
                className="px-4 py-2 rounded-md border border-input bg-background"
                value={selectedBuilding || ""}
                onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              
              <select 
                className="px-4 py-2 rounded-md border border-input bg-background"
                value={selectedFloor?.toString() || ""}
                onChange={(e) => setSelectedFloor(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Floors</option>
                {floors.map(floor => (
                  <option key={floor.toString()} value={floor.toString()}>
                    Floor {floor}
                  </option>
                ))}
              </select>
            </div>

            {buildingRooms.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">
                  {searchTerm ? "No rooms match your search." : "No rooms in selected building/floor."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {selectedFloor ? (
                  <FloorRooms
                    floor={selectedFloor}
                    rooms={buildingRooms}
                    canModifyRooms={canModifyRooms}
                    onToggleAvailability={handleToggleRoomAvailability}
                    onSelectRoom={handleRoomSelect}
                  />
                ) : (
                  floors.map(floor => {
                    const floorRooms = buildingRooms.filter(room => room.floor === floor);
                    if (floorRooms.length === 0) return null;
                    
                    return (
                      <FloorRooms
                        key={floor.toString()}
                        floor={floor}
                        rooms={floorRooms}
                        canModifyRooms={canModifyRooms}
                        onToggleAvailability={handleToggleRoomAvailability}
                        onSelectRoom={handleRoomSelect}
                      />
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            onSubmit={handleAddRoom}
            onCancel={() => setIsRoomDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Rooms from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <Input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with room details
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!fileToUpload || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
