import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ClipboardList, Building2, Users } from "lucide-react";
import { User } from '@/lib/types';
import AdminDashboardCards from './admin/AdminDashboardCards';
import BuildingsTab from './admin/BuildingsTab';
import FacultyTab from './admin/FacultyTab';
import AnalyticsTab from './admin/AnalyticsTab';
import { useRoomUsageData } from '@/hooks/useRoomUsageData';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { roomUsageData } = useRoomUsageData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      <AdminDashboardCards />

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
            <BuildingsTab />
          </TabsContent>
          
          <TabsContent value="faculty">
            <FacultyTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab roomUsageData={roomUsageData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
