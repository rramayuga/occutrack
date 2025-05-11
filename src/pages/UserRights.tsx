
import React from 'react';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useUserRightsManagement } from '@/hooks/useUserRightsManagement';
import UsersList from '@/components/admin/users/UsersList';
import UserRightsFilters from '@/components/admin/users/UserRightsFilters';
import { ArrowLeft } from 'lucide-react';

const UserRights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if the user has permission to access this page
  const hasPermission = user && (user.role === 'admin' || user.role === 'superadmin');
  
  React.useEffect(() => {
    if (!hasPermission) {
      navigate('/auth-required');
    }
  }, [hasPermission, navigate]);
  
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    handleDeleteUser,
    filteredUsers,
    viewFilter,
    setViewFilter,
    editFilter,
    setEditFilter,
    deleteFilter,
    setDeleteFilter
  } = useUserRightsManagement(true); // Always fetch data
  
  if (!hasPermission) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 pt-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button 
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
            <h1 className="text-2xl font-bold">User Rights Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <UserRightsFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              viewFilter={viewFilter}
              setViewFilter={setViewFilter}
              editFilter={editFilter}
              setEditFilter={setEditFilter}
              deleteFilter={deleteFilter}
              setDeleteFilter={setDeleteFilter}
            />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow min-h-[500px] flex flex-col">
            <UsersList
              users={users}
              loading={loading}
              filteredUsers={filteredUsers}
              handleRoleChange={handleRoleChange}
              handleDeleteUser={handleDeleteUser}
              viewFilter={viewFilter}
              editFilter={editFilter}
              deleteFilter={deleteFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRights;
