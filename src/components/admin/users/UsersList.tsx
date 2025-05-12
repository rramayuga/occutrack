
import React, { useState } from 'react';
import { User, UserRole } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleSelector from './UserRoleSelector';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UsersListProps {
  users: User[];
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
  handleDeleteUser?: (userId: string) => void;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users,
  loading,
  filteredUsers,
  handleRoleChange,
  handleDeleteUser
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete && handleDeleteUser) {
      handleDeleteUser(userToDelete);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 border rounded-md">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
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
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-4 p-3 border-b items-center">
                <div>{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div>
                  <UserRoleSelector 
                    key={`${user.id}-${user.role}`} 
                    currentRole={user.role} 
                    onRoleChange={(newRole) => {
                      console.log(`Changing role for user ${user.id} from ${user.role} to ${newRole}`);
                      handleRoleChange(user.id, newRole);
                    }} 
                  />
                </div>
                <div className="flex justify-end">
                  {handleDeleteUser && currentUser?.id !== user.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(user.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersList;
