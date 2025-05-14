
import React, { useState } from 'react';
import { User, UserRole } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleSelector from './UserRoleSelector';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Trash2, UserX } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface UsersListProps {
  users: User[];
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
  handleDeleteUser?: (userId: string) => Promise<void>;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users,
  loading,
  filteredUsers,
  handleRoleChange,
  handleDeleteUser
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete && handleDeleteUser) {
      try {
        setIsDeletingUser(true);
        await handleDeleteUser(userToDelete);
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        toast({
          title: "Success",
          description: "User account has been permanently deleted."
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description: "Failed to delete the user account. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsDeletingUser(false);
      }
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
                      title="Delete User Account"
                    >
                      <UserX className="h-4 w-4" />
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
            <AlertDialogCancel disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersList;
