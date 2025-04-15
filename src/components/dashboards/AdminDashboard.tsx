import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BuildingWithFloors, Room } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from 'lucide-react';
import AdminDashboardCards from './admin/AdminDashboardCards';
import { useToast } from "@/hooks/use-toast";
import BuildingsTab from './admin/BuildingsTab';
import FacultyTab from './admin/FacultyTab';
import AnalyticsTab from './admin/AnalyticsTab';
import BuildingForm from '@/components/admin/BuildingForm';
import RoomForm from '@/components/admin/RoomForm';
import EditBuildingDialog from '@/components/admin/EditBuildingDialog';
import DeleteBuildingDialog from '@/components/admin/DeleteBuildingDialog';
import { useBuildings } from '@/hooks/useBuildings';
import { useEnhancedRoomsManagement } from '@/hooks/useEnhancedRoomsManagement';
import { supabase } from "@/integrations/supabase/client";

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user_id: string;
}

interface BuildingFormValues {
  name: string;
  floorCount: number;
  location?: string;
}

interface RoomFormValues {
  name: string;
  type: string;
  floor: number;
  buildingId: string;
  isAvailable: boolean;
}

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyCount, setFacultyCount] = useState(0);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithFloors | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [utilizationRate, setUtilizationRate] = useState<string>("0%");
  
  const { buildings, loading, addBuilding, editBuilding, deleteBuilding } = useBuildings();
  const { addRoom } = useEnhancedRoomsManagement();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setIsLoadingFaculty(true);
        
        const { data: facultyRequestsData, error: facultyRequestsError } = await supabase
          .from('faculty_requests')
          .select('*')
          .eq('status', 'approved');
          
        if (facultyRequestsError) throw facultyRequestsError;
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'faculty');
          
        if (profilesError) throw profilesError;
        
        const facultyIds = new Set();
        const combinedFaculty: FacultyMember[] = [];
        
        if (facultyRequestsData) {
          facultyRequestsData.forEach(item => {
            facultyIds.add(item.user_id);
            combinedFaculty.push({
              id: item.id,
              name: item.name,
              email: item.email,
              department: item.department,
              status: item.status as 'pending' | 'approved' | 'rejected',
              createdAt: item.created_at,
              user_id: item.user_id
            });
          });
        }
        
        if (profilesData) {
          profilesData.forEach(profile => {
            if (!facultyIds.has(profile.id)) {
              combinedFaculty.push({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                department: 'N/A',
                status: 'approved',
                createdAt: profile.created_at,
                user_id: profile.id
              });
            }
          });
        }
        
        setFacultyCount(combinedFaculty.length);
        setFacultyMembers(combinedFaculty);
      } catch (error) {
        console.error('Error fetching faculty data:', error);
      } finally {
        setIsLoadingFaculty(false);
      }
    };
    
    fetchFacultyData();
  }, []);
  
  const calculateUtilizationRate = useCallback(async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('status');
        
      if (roomsError) throw roomsError;
      
      if (roomsData) {
        const totalRooms = roomsData.length;
        const occupiedRooms = roomsData.filter(room => 
          room.status === 'occupied'
        ).length;
        
        const rate = totalRooms > 0 
          ? Math.round((occupiedRooms / totalRooms) * 100)
          : 0;
          
        setUtilizationRate(`${rate}%`);
      }
    } catch (error) {
      console.error('Error calculating utilization rate:', error);
    }
  }, []);

  useEffect(() => {
    calculateUtilizationRate();
    
    const channel = supabase
      .channel('room-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        () => {
          calculateUtilizationRate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calculateUtilizationRate]);
  
  const onBuildingSubmit = async (data: BuildingFormValues) => {
    const result = await addBuilding(data.name, data.floorCount, data.location);
    if (result) {
      setIsBuildingDialogOpen(false);
    }
  };
  
  const onEditBuildingSubmit = async (data: BuildingFormValues) => {
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
  
  const onRoomSubmit = async (data: RoomFormValues) => {
    const roomData: Omit<Room, 'id'> = {
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
    navigate('/faculty-management', { state: { selectedFacultyId: facultyId, isEditing: true } });
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
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
          </DialogHeader>
          <BuildingForm 
            onSubmit={onBuildingSubmit} 
            onCancel={() => setIsBuildingDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomForm 
            onSubmit={onRoomSubmit} 
            onCancel={() => setIsRoomDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <EditBuildingDialog
        building={selectedBuilding}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedBuilding(null);
        }}
        onSubmit={onEditBuildingSubmit}
      />
      
      <DeleteBuildingDialog
        building={selectedBuilding}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedBuilding(null);
        }}
        onConfirm={onDeleteBuilding}
      />
    </div>
  );
};
