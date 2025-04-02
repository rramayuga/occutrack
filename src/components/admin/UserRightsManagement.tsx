
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserRightsFilters from './users/UserRightsFilters';
import UsersList from './users/UsersList';
import { useUserRightsManagement } from '@/hooks/useUserRightsManagement';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface UserRightsManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserRightsManagement: React.FC<UserRightsManagementDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';
  
  // If admin, redirect to the dedicated page
  React.useEffect(() => {
    if (open && isAdmin && !isSuperAdmin) {
      navigate('/user-rights');
      onClose();
    }
  }, [open, isAdmin, isSuperAdmin, navigate, onClose]);
  
  // Only use the hook and render the dialog for superadmin
  const {
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    filteredUsers
  } = useUserRightsManagement(open && isSuperAdmin);
  
  if (isAdmin && !isSuperAdmin) {
    return null; // Don't render anything for admin as they will be redirected
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage User Rights</DialogTitle>
        </DialogHeader>
        
        <UserRightsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
        />
        
        <UsersList
          users={[]} // This is not used directly in the component
          loading={loading}
          filteredUsers={filteredUsers}
          handleRoleChange={handleRoleChange}
        />
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRightsManagement;
