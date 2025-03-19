
import React, { useState, useEffect } from 'react';
import { useRoomsManagement } from '@/hooks/useRoomsManagement';
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
import { DataTable } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuildingCard from "@/components/admin/BuildingCard";
import BuildingForm from "@/components/admin/BuildingForm";
import RoomForm from "@/components/admin/RoomForm";

const RoomManagement = () => {
  const {
    buildings,
    rooms,
    loading,
    selectedBuilding,
    selectedFloor,
    isAddingRoom,
    isAddingBuilding,
    roomFilter,
    setRoomFilter,
    setSelectedBuilding,
    setSelectedFloor,
    setIsAddingRoom,
    setIsAddingBuilding,
    handleAddRoom,
    handleAddBuilding,
    handleDeleteRoom,
    handleDeleteBuilding,
    filterRooms,
  } = useRoomsManagement();

  // Get unique floors for the selected building
  const getFloorsForSelectedBuilding = () => {
    if (!selectedBuilding) return [];
    const building = buildings.find(b => b.id === selectedBuilding);
    if (!building) return [];
    return building.floors;
  };

  // Filter rooms by building and floor
  const filteredRooms = filterRooms();

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

          {loading ? (
            <p>Loading buildings...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map(building => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  onDelete={() => handleDeleteBuilding(building.id)}
                />
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
                onValueChange={(value) => setSelectedFloor(parseInt(value))}
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

          {loading ? (
            <p>Loading rooms...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Floor</th>
                    <th className="text-left p-2">Capacity</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <tr key={room.id} className="border-b">
                        <td className="p-2">{room.name}</td>
                        <td className="p-2">{room.type}</td>
                        <td className="p-2">{room.floor}</td>
                        <td className="p-2">{room.capacity || "N/A"}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              room.isAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {room.isAvailable ? "Available" : "Occupied"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-2 text-center">
                        No rooms found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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
          <BuildingForm onSubmit={handleAddBuilding} onCancel={() => setIsAddingBuilding(false)} />
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
          <RoomForm
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSubmit={handleAddRoom}
            onCancel={() => setIsAddingRoom(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomManagement;
