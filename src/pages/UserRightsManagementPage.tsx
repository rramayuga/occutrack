
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRightsManagement } from '@/hooks/useUserRightsManagement';
import UserRightsFilters from '@/components/admin/users/UserRightsFilters';
import UsersList from '@/components/admin/users/UsersList';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

const UserRightsManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthorized = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Redirect to home if not authorized
  useEffect(() => {
    if (user && !isAuthorized) {
      navigate('/');
    }
  }, [user, isAuthorized, navigate]);
  
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
    fetchUsers,
    viewFilter,
    setViewFilter,
    editFilter,
    setEditFilter,
    deleteFilter,
    setDeleteFilter
  } = useUserRightsManagement(isAuthorized);  // Only fetch users when component mounts and user is authorized
  
  // Re-fetch users when component mounts to ensure we have the latest data
  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized, fetchUsers]);

  if (!isAuthorized) {
    return null; // Don't render anything if not authorized
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage User Rights</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>
              Assign and modify user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            
            <UsersList
              users={users || []}
              loading={loading}
              filteredUsers={filteredUsers}
              handleRoleChange={handleRoleChange}
              handleDeleteUser={handleDeleteUser}
              viewFilter={viewFilter}
              editFilter={editFilter}
              deleteFilter={deleteFilter}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserRightsManagementPage;
