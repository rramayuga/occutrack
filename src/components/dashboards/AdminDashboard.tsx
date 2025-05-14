
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingWithFloors, User } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from 'lucide-react';
import AdminDashboardCards from './admin/AdminDashboardCards';
import BuildingsTab from './admin/BuildingsTab';
import FacultyTab from './admin/FacultyTab';
import AnalyticsTab from './admin/AnalyticsTab';
import BuildingManagementDialogs from '../admin/dialogs/BuildingManagementDialogs';
import { useBuildings } from '@/hooks/useBuildings';
import { useEnhancedRoomsManagement } from '@/hooks/useEnhancedRoomsManagement';
import { useFacultyManagement } from '@/hooks/useFacultyManagement';
import { useRoomUtilization } from '@/hooks/useRoomUtilization';
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithFloors | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { buildings, loading, addBuilding, editBuilding, deleteBuilding } = useBuildings();
  const { addRoom } = useEnhancedRoomsManagement();
  const { facultyCount, facultyMembers, isLoadingFaculty } = useFacultyManagement();
  const utilizationRate = useRoomUtilization();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onBuildingSubmit = async (data: any) => {
    const result = await addBuilding(data.name, data.floorCount, data.location);
    if (result) {
      setIsBuildingDialogOpen(false);
    }
  };

  const onEditBuildingSubmit = async (data: any) => {
    if (selectedBuilding) {
      const result = await editBuilding(selectedBuilding.id, data.name, data.location);
      if (result) {
        setIsEditDialogOpen(false);
        setSelectedBuilding(null);
        toast({
          title: "Building updated",
          description: `${data.name} has been updated successfully.`
        });
      }
    }
  };

  const onDeleteBuilding = async () => {
    if (selectedBuilding) {
      const result = await deleteBuilding(selectedBuilding.id);
      if (result) {
        setIsDeleteDialogOpen(false);
        setSelectedBuilding(null);
        toast({
          title: "Building deleted",
          description: `${selectedBuilding.name} has been deleted.`
        });
      }
    }
  };

  const onRoomSubmit = async (data: any) => {
    const roomData = {
      name: data.name,
      type: data.type,
      floor: data.floor,
      buildingId: data.buildingId,
      isAvailable: data.isAvailable,
      capacity: 30
    };
    
    const result = await addRoom(roomData);
    if (result) {
      setIsRoomDialogOpen(false);
    }
  };

  const handleViewBuilding = (id: string) => {
    window.location.href = '/rooms';
  };

  const handleEditBuilding = (building: BuildingWithFloors) => {
    setSelectedBuilding(building);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBuilding = (building: BuildingWithFloors) => {
    setSelectedBuilding(building);
    setIsDeleteDialogOpen(true);
  };

  const handleViewFaculty = (facultyId: string) => {
    navigate('/faculty-management', { state: { selectedFacultyId: facultyId } });
  };

  const handleEditFaculty = (facultyId: string) => {
    navigate('/faculty-management', { 
      state: { selectedFacultyId: facultyId, isEditing: true } 
    });
  };
  
  const handleDeleteFaculty = (facultyId: string) => {
    navigate('/faculty-management', { 
      state: { selectedFacultyId: facultyId, isDeleting: true } 
    });
  };

  const filteredBuildings = buildings.filter(building => {
    if (!searchTerm) return true;
    return building.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

      <AdminDashboardCards
        buildings={buildings.length}
        rooms={buildings.reduce((total, building) => total + (building.roomCount || 0), 0)}
        facultyCount={facultyCount}
        utilizationRate={utilizationRate}
      />

      <Tabs defaultValue="buildings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buildings">
          <BuildingsTab
            buildings={buildings}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddBuilding={() => setIsBuildingDialogOpen(true)}
            filteredBuildings={filteredBuildings}
            handleViewBuilding={handleViewBuilding}
            handleEditBuilding={handleEditBuilding}
            handleDeleteBuilding={handleDeleteBuilding}
          />
        </TabsContent>
        
        <TabsContent value="faculty">
          <FacultyTab
            isLoadingFaculty={isLoadingFaculty}
            facultyMembers={facultyMembers}
            handleViewFaculty={handleViewFaculty}
            handleEditFaculty={handleEditFaculty}
            handleDeleteFaculty={handleDeleteFaculty}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>

      <BuildingManagementDialogs
        isBuildingDialogOpen={isBuildingDialogOpen}
        setIsBuildingDialogOpen={setIsBuildingDialogOpen}
        isRoomDialogOpen={isRoomDialogOpen}
        setIsRoomDialogOpen={setIsRoomDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        selectedBuilding={selectedBuilding}
        setSelectedBuilding={setSelectedBuilding}
        onBuildingSubmit={onBuildingSubmit}
        onRoomSubmit={onRoomSubmit}
        onEditBuildingSubmit={onEditBuildingSubmit}
        onDeleteBuilding={onDeleteBuilding}
      />
    </div>
  );
};

export default AdminDashboard;
