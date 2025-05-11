
import React, { useState } from 'react';
import { User, UserRole } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleSelector from './UserRoleSelector';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Pencil, Trash2, User as UserIcon } from 'lucide-react';

interface UsersListProps {
  users: User[];
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
  handleDeleteUser: (userId: string) => void;
  viewFilter: boolean;
  editFilter: boolean;
  deleteFilter: boolean;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users,
  loading,
  filteredUsers,
  handleRoleChange,
  handleDeleteUser,
  viewFilter,
  editFilter,
  deleteFilter
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  const [isEditMode, setIsEditMode] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const toggleEditMode = (userId: string) => {
    setIsEditMode(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      handleDeleteUser(userToDelete.id);
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Apply additional filters based on checkbox selections
  const displayUsers = filteredUsers.filter(user => {
    if (!viewFilter && !editFilter && !deleteFilter) {
      // If none are selected, show all
      return true;
    }

    const canEdit = editFilter && (
      isSuperAdmin || 
      (currentUser?.role === 'admin' && (user.role === 'faculty' || user.role === 'student'))
    );
    
    const canDelete = deleteFilter && isSuperAdmin;
    
    return (viewFilter && true) || canEdit || canDelete;
  });

  return (
    <ScrollArea className="flex-1 border rounded-md">
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">
          Loading users...
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No users found.
        </div>
      ) : (
        <div className="min-w-full">
          <div className="grid grid-cols-4 font-medium p-3 border-b">
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
            <div className="text-right">Actions</div>
          </div>
          {displayUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-4 p-3 border-b items-center">
              <div>{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div>
                {isEditMode[user.id] ? (
                  <UserRoleSelector 
                    key={`${user.id}-${user.role}`} 
                    currentRole={user.role} 
                    onRoleChange={(newRole) => {
                      console.log(`Changing role for user ${user.id} from ${user.role} to ${newRole}`);
                      handleRoleChange(user.id, newRole);
                      toggleEditMode(user.id);
                    }} 
                  />
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{user.role}</span>
                )}
              </div>
              <div className="flex justify-end gap-2">
                {(!isEditMode[user.id] && editFilter) && (
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleEditMode(user.id)}
                    disabled={
                      user.id === currentUser?.id ||
                      !(isSuperAdmin || 
                        (currentUser?.role === 'admin' && 
                         (user.role === 'faculty' || user.role === 'student')))
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {(isEditMode[user.id] && editFilter) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleEditMode(user.id)}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                {(viewFilter && !isEditMode[user.id]) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={`/users/${user.id}`}><UserIcon className="h-4 w-4" /></a>
                  </Button>
                )}
                {(deleteFilter && isSuperAdmin && !isEditMode[user.id]) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => confirmDeleteUser(user)}
                    disabled={user.id === currentUser?.id || user.role === 'superadmin'}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for {userToDelete?.name}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
};

export default UsersList;
