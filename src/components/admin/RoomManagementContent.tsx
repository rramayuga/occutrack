
import React, { useEffect } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuildingsList from './BuildingsList';
import RoomTable from './RoomTable';
import RoomFilters from './RoomFilters';
import RoomForm from './RoomForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRoomManagement } from './context/RoomManagementContext';
import { useRoomManagementState } from '@/hooks/useRoomManagementState';
import RoomActionsToolbar from './rooms/RoomActionsToolbar';
import ImportRoomDialog from './rooms/ImportRoomDialog';

const RoomManagementContent = () => {
  const [activeTab, setActiveTab] = React.useState("buildings");
  
  const { 
    buildings, 
    loading: buildingsLoading, 
    addBuilding,
    updateBuilding, // Use updateBuilding instead of editBuilding
    deleteBuilding
  } = useBuildings();

  const {
    rooms,
    setRooms,
    isAddingRoom,
    setIsAddingRoom,
    isImportDialogOpen,
    setIsImportDialogOpen,
    csvFile,
    setCsvFile,
    isUploading,
    roomsLoading,
    handleAddRoom,
    handleDeleteRoom,
    handleCsvImport,
    exportRoomsToCsv,
    fetchedRooms
  } = useRoomManagementState();
  
  const { 
    selectedBuilding, 
    setSelectedBuilding, 
    selectedFloor, 
    setSelectedFloor, 
    roomFilter, 
    setRoomFilter, 
    filteredRooms, 
    setFilteredRooms 
  } = useRoomManagement();

  useEffect(() => {
    setRooms(fetchedRooms);
  }, [fetchedRooms]);

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
  
  useEffect(() => {
    filterRooms();
  }, [selectedBuilding, selectedFloor, roomFilter, rooms]);

  const getFloorsForSelectedBuilding = () => {
    if (!selectedBuilding) return [];
    const building = buildings.find(b => b.id === selectedBuilding);
    if (!building || !building.floors) return [];
    return building.floors.map(floor => floor.number);
  };

  const handleViewBuilding = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setActiveTab("rooms");
  };

  const handleUpdateBuilding = (id: string, data: any) => {
    console.log("Updating building with:", id, data);
    // Use updateBuilding function that correctly handles floor count
    return updateBuilding(id, data.name, data.floorCount, data.location);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="buildings">Buildings</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
      </TabsList>

      <TabsContent value="buildings">
        <BuildingsList 
          buildings={buildings}
          onViewRooms={handleViewBuilding}
          onDeleteBuilding={deleteBuilding}
          onUpdateBuilding={handleUpdateBuilding}
          isLoading={buildingsLoading}
        />
      </TabsContent>

      <TabsContent value="rooms" className="space-y-4">
        <RoomFilters 
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          roomFilter={roomFilter}
          setRoomFilter={setRoomFilter}
          getFloorsForSelectedBuilding={getFloorsForSelectedBuilding}
        />

        <RoomActionsToolbar
          onImport={() => setIsImportDialogOpen(true)}
          onExport={exportRoomsToCsv}
          onAddRoom={() => setIsAddingRoom(true)}
          selectedBuilding={selectedBuilding}
        />

        <RoomTable 
          rooms={filteredRooms}
          onDeleteRoom={handleDeleteRoom}
          isLoading={roomsLoading}
          selectedBuilding={selectedBuilding}
        />

        <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Room</DialogTitle>
            </DialogHeader>
            <RoomForm 
              onSubmit={handleAddRoom} 
              onCancel={() => setIsAddingRoom(false)} 
              defaultBuildingId={selectedBuilding}
            />
          </DialogContent>
        </Dialog>

        <ImportRoomDialog 
          isOpen={isImportDialogOpen}
          onClose={() => {
            setIsImportDialogOpen(false);
            setCsvFile(null);
          }}
          onFileSelect={(file) => setCsvFile(file)}
          onImport={handleCsvImport}
          isUploading={isUploading}
          hasFile={!!csvFile}
        />
      </TabsContent>
    </Tabs>
  );
};

export default RoomManagementContent;
