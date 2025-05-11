
import React from 'react';
import { User } from '@/lib/types';
import OverviewCards from './superadmin/OverviewCards';
import AdminTools from './superadmin/AdminTools';
import { Button } from '@/components/ui/button';
import { Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuperAdminDashboardProps {
  user: User;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Super Administrator Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      <div className="flex gap-4 mb-8">
        <Button 
          onClick={() => navigate('/user-rights')}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Manage User Rights
        </Button>
        <Button 
          onClick={() => navigate('/admin/announcements')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Post Announcements
        </Button>
      </div>

      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <AdminTools />
      </div>
    </div>
  );
};
