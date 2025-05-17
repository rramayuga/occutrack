
import React, { useEffect, useCallback, useMemo, memo } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import BuildingList from '@/components/rooms/BuildingList';
import FloorRooms from '@/components/rooms/FloorRooms';
import { useRooms } from '@/hooks/useRooms';

// Memoized FloorRooms component to prevent unnecessary re-renders
const MemoizedFloorRooms = memo(FloorRooms);

const Rooms = () => {
  const { 
    buildings, 
    rooms, 
    isLoading: loading, 
    selectedBuilding, 
    setSelectedBuilding, 
    handleToggleRoomAvailability,
    refreshRooms: refetchRooms
  } = useRooms();
  
  const { user } = useAuth();

  // Set a default building if none is selected and buildings are available
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings, selectedBuilding, setSelectedBuilding]);
  
  // Auto-refresh room data less frequently to reduce unnecessary updates
  useEffect(() => {
    console.log("Setting up auto-refresh for room data");
    const autoRefreshInterval = setInterval(() => {
      console.log("Auto-refreshing room data");
      refetchRooms();
    }, 120000); // Refresh every 2 minutes (increased from 30 seconds)
    
    // Initial fetch
    refetchRooms();
    
    return () => {
      console.log("Cleaning up auto-refresh interval");
      clearInterval(autoRefreshInterval);
    };
  }, [refetchRooms]);

  // Memoize expensive calculations
  const buildingRooms = useMemo(() => 
    rooms.filter(room => room.buildingId === selectedBuilding),
    [rooms, selectedBuilding]
  );
  
  // Memoize room grouping by floor
  const roomsByFloor = useMemo(() => {
    return buildingRooms.reduce((acc, room) => {
      if (!acc[room.floor]) {
        acc[room.floor] = [];
      }
      acc[room.floor].push(room);
      return acc;
    }, {} as Record<number, typeof rooms>);
  }, [buildingRooms]);

  // Get the floors for the selected building - memoized
  const selectedBuildingData = useMemo(() => 
    buildings.find(b => b.id === selectedBuilding),
    [buildings, selectedBuilding]
  );
  
  const floors = useMemo(() => 
    selectedBuildingData?.floors || [],
    [selectedBuildingData]
  );

  // Determine if the current user can modify room availability
  const authorizedRoles = ['faculty', 'admin', 'superadmin'];
  const canModifyRooms = user && authorizedRoles.includes(user.role);
  
  // Memoize building list to prevent re-renders
  const buildingListMemo = useMemo(() => (
    <BuildingList 
      buildings={buildings}
      selectedBuilding={selectedBuilding}
      onBuildingChange={setSelectedBuilding}
    />
  ), [buildings, selectedBuilding, setSelectedBuilding]);
  
  // Create memoized floor content
  const floorsContent = useMemo(() => (
    floors.length === 0 ? (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No floors found for this building.</p>
      </div>
    ) : (
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-6">
          {floors.map((floor) => {
            const floorRooms = roomsByFloor[floor.number] || [];
            return (
              <MemoizedFloorRooms 
                key={`${floor.id}-${floorRooms.length}`}
                floor={floor.number}
                rooms={floorRooms}
                canModifyRooms={canModifyRooms}
                onToggleAvailability={handleToggleRoomAvailability}
                refetchRooms={refetchRooms}
              />
            );
          })}
        </div>
      </div>
    )
  ), [floors, roomsByFloor, canModifyRooms, handleToggleRoomAvailability, refetchRooms]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Campus Rooms</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
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
            value={selectedBuilding} 
            onValueChange={setSelectedBuilding} 
            className="w-full"
          >
            {buildingListMemo}

            {buildings.map((building) => (
              <TabsContent key={building.id} value={building.id}>
                {floorsContent}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default memo(Rooms);
