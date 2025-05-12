
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ClipboardList, Building2, Users } from "lucide-react";
import { User } from '@/lib/types';
import AdminDashboardCards from './admin/AdminDashboardCards';
import BuildingsTab from './admin/BuildingsTab';
import FacultyTab from './admin/FacultyTab';
import AnalyticsTab from './admin/AnalyticsTab';
import { useRoomUsageData } from '@/hooks/useRoomUsageData';
import { useBuildings } from '@/hooks/useBuildings';
import { BuildingWithFloors } from '@/lib/types';
import { useFacultyManagement } from '@/hooks/useFacultyManagement';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { roomUsageData } = useRoomUsageData();
  const { buildings, loading } = useBuildings();
  const { facultyCount, facultyMembers, isLoadingFaculty } = useFacultyManagement();
  
  // States and handlers for BuildingsTab
  const [searchTerm, setSearchTerm] = useState("");
  const filteredBuildings = buildings.filter(building => 
    building.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Mock room count for AdminDashboardCards
  const roomCount = buildings.reduce((total, building) => total + (building.roomCount || 0), 0);
  
  // Mock handlers for faculty management
  const handleViewFaculty = (facultyId: string) => {
    console.log("View faculty", facultyId);
  };
  
  const handleEditFaculty = (facultyId: string) => {
    console.log("Edit faculty", facultyId);
  };
  
  // Mock handlers for building management
  const handleViewBuilding = (id: string) => {
    console.log("View building", id);
  };
  
  const handleEditBuilding = (building: BuildingWithFloors) => {
    console.log("Edit building", building);
  };
  
  const handleDeleteBuilding = (building: BuildingWithFloors) => {
    console.log("Delete building", building);
  };
  
  const onAddBuilding = () => {
    console.log("Add building");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      <AdminDashboardCards 
        buildings={buildings.length}
        rooms={roomCount}
        facultyCount={facultyCount}
        utilizationRate="65%"
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:w-[400px] mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Buildings</span>
            </TabsTrigger>
            <TabsTrigger value="faculty" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Faculty</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <p>Quick overview of your admin panel. Select a tab to manage specific aspects of the system.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Content will go here */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="buildings">
            <BuildingsTab 
              buildings={buildings}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddBuilding={onAddBuilding}
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
            <AnalyticsTab roomUsageData={roomUsageData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
