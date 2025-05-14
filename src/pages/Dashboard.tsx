
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../lib/auth';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { ProfessorDashboard } from '../components/dashboards/ProfessorDashboard';
import { StudentDashboard } from '../components/dashboards/StudentDashboard';
import { SuperAdminDashboard } from '../components/dashboards/SuperAdminDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Improved SEO
  useEffect(() => {
    document.title = 'Dashboard | Campus Room Management';
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'faculty':
        return <ProfessorDashboard user={user} />;
      case 'student':
        return <StudentDashboard user={user} />;
      case 'superadmin':
        return <SuperAdminDashboard user={user} />;
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
            <p>Your account is set up, but your role has not been assigned yet.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">{renderDashboard()}</div>
    </div>
  );
};

export default Dashboard;
