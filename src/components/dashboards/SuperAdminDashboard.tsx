
import React from 'react';
import { User } from '@/lib/types';
import OverviewCards from './superadmin/OverviewCards';
import SystemOverview from './superadmin/SystemOverview';
import AdminTools from './superadmin/AdminTools';
import StaffOverview from './superadmin/StaffOverview';
import CampusNetwork from './superadmin/CampusNetwork';
import { useSuperAdminData } from './superadmin/useSuperAdminData';

interface SuperAdminDashboardProps {
  user: User;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const { facultyMembers, adminUsers, isLoading } = useSuperAdminData();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Super Administrator Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      {/* Overview Cards */}
      <OverviewCards />

      {/* System Status and Admin Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SystemOverview />
        <AdminTools />
      </div>

      {/* Admin/Faculty Staff Overview */}
      <StaffOverview 
        adminUsers={adminUsers}
        facultyMembers={facultyMembers}
        isLoading={isLoading}
      />

      {/* Multi-Campus Overview */}
      <CampusNetwork />
    </div>
  );
};
