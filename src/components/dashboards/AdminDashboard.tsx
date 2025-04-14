import React, { useState, useEffect } from 'react';
import { User, Room, FacultyMember, BuildingWithFloors } from '@/lib/types';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Users, Building, Settings, Plus, Search, Edit, Trash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import BuildingCard from '@/components/admin/BuildingCard';
import BuildingForm, { BuildingFormValues } from '@/components/admin/BuildingForm';
import RoomForm, { RoomFormValues } from '@/components/admin/RoomForm';
import EditBuildingDialog from '@/components/admin/EditBuildingDialog';
import DeleteBuildingDialog from '@/components/admin/DeleteBuildingDialog';
import RoomUsageStats from '@/components/admin/RoomUsageStats';
import { useBuildings } from '@/hooks/useBuildings';
import { useEnhancedRoomsManagement } from '@/hooks/useEnhancedRoomsManagement';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

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
                {buildings.reduce((total, building) => total + (building.roomCount || 0), 0)}
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
              <span className="text-3xl font-bold">{facultyCount}</span>
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

      <Tabs defaultValue="buildings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buildings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Building Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search buildings..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={() => setIsBuildingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="opacity-50">
                  <CardHeader>
                    <CardTitle className="h-6 bg-gray-200 animate-pulse rounded" />
                    <CardDescription className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-4" />
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 animate-pulse rounded flex-1" />
                      <div className="h-8 bg-gray-200 animate-pulse rounded flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBuildings.length === 0 ? (
              <div className="col-span-3 text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">
                  {searchTerm ? "No buildings match your search." : "No buildings available. Add a building to get started."}
                </p>
              </div>
            ) : (
              filteredBuildings.map((building) => (
                <BuildingCard 
                  key={building.id}
                  id={building.id}
                  name={building.name}
                  roomCount={building.roomCount || 0}
                  utilization={building.utilization || '0%'}
                  onView={() => handleViewBuilding(building.id)}
                  onEdit={() => handleEditBuilding(building)}
                  onDelete={() => handleDeleteBuilding(building)}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="faculty" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Faculty Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search faculty..." 
              />
              <Button variant="outline" size="sm" onClick={() => navigate('/faculty-management')}>
                <Users className="h-4 w-4 mr-2" /> Manage
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
            
            <div className="min-h-[200px]">
              {isLoadingFaculty ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading approved faculty members...
                </div>
              ) : facultyMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No approved faculty members found.
                </div>
              ) : (
                facultyMembers.map(faculty => (
                  <div key={faculty.id} className="grid grid-cols-5 p-4 border-b last:border-0 items-center">
                    <div>{faculty.name}</div>
                    <div>{faculty.department}</div>
                    <div className="text-sm">{faculty.email}</div>
                    <div>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewFaculty(faculty.id)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditFaculty(faculty.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Utilization Analytics</CardTitle>
              <CardDescription>View utilization metrics for campus rooms</CardDescription>
            </CardHeader>
            <CardContent className="h-auto">
              <RoomUsageStats />
            </CardContent>
          </Card>
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
