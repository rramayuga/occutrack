
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { User, UserRole } from '@/lib/types';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
import { ProfessorDashboard } from '@/components/dashboards/ProfessorDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { SuperAdminDashboard } from '@/components/dashboards/SuperAdminDashboard';
import { useAuth } from '@/lib/auth';

const Dashboard = () => {
  const { user, isLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Always fetch fresh user data when the dashboard mounts
  useEffect(() => {
    console.log('Dashboard mounted, refreshing user data');
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      // No user found, redirect to login
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const renderDashboardByRole = () => {
    if (isLoading) return <DashboardSkeleton />;
    if (!user) return <NotAuthenticated />;

    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} />;
      case 'faculty':
        return <ProfessorDashboard user={user} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'superadmin':
        return <SuperAdminDashboard user={user} />;
      default:
        return <NotAuthenticated />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        {renderDashboardByRole()}
      </div>
    </div>
  );
};

// Skeleton loader for dashboard
const DashboardSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="h-8 w-64 rounded-md bg-gray-200 animate-pulse mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-gray-200 animate-pulse" />
      ))}
    </div>
    <div className="h-64 rounded-lg bg-gray-200 animate-pulse" />
  </div>
);

// Not authenticated view
const NotAuthenticated = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Not Authenticated</h2>
      <p className="text-gray-600 mb-8">
        Please sign in to access your dashboard.
      </p>
      <a 
        href="/login" 
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Sign In
      </a>
    </div>
  </div>
);

export default Dashboard;
