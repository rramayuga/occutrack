
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRightsManagement } from '@/hooks/useUserRightsManagement';
import UserRightsFilters from '@/components/admin/users/UserRightsFilters';
import UsersList from '@/components/admin/users/UsersList';
import Navbar from '@/components/layout/Navbar';

const UserRightsManagementPage = () => {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    filteredUsers
  } = useUserRightsManagement(true);  // Always fetch users when component mounts
  
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
            />
            
            <UsersList
              users={[]}  // This is not used directly in the component
              loading={loading}
              filteredUsers={filteredUsers}
              handleRoleChange={handleRoleChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserRightsManagementPage;
