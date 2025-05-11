
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { User, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserRoleSelector from '@/components/admin/users/UserRoleSelector';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useBoolean } from '@/hooks/useBoolean';
import { useAuth } from '@/lib/auth';
import { Badge } from "@/components/ui/badge";

interface UsersListProps {
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
  handleDeleteUser: (userId: string) => Promise<boolean>;
  showFullDetails?: boolean; // Added to show all details by default
}

const UsersList: React.FC<UsersListProps> = ({ loading, filteredUsers, handleRoleChange, handleDeleteUser, showFullDetails = true }) => {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [editMode, setEditMode] = React.useState<{[key: string]: boolean}>({});
  const { value: isDeleteDialogOpen, setTrue: openDeleteDialog, setFalse: closeDeleteDialog } = useBoolean(false);
  
  // Check if current user can delete the selected user
  const canDelete = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Cannot delete yourself
    if (targetUser.id === currentUser.id) return false;
    
    // SuperAdmins can delete anyone except other superadmins
    if (currentUser.role === 'superadmin') {
      return targetUser.role !== 'superadmin';
    }
    
    // Admins can only delete faculty and students
    if (currentUser.role === 'admin') {
      return targetUser.role === 'faculty' || targetUser.role === 'student';
    }
    
    return false;
  };
  
  // Check if current user can change roles for target user
  const canChangeRole = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Cannot change your own role
    if (targetUser.id === currentUser.id) return false;
    
    // SuperAdmins can change anyone's role except other superadmins
    if (currentUser.role === 'superadmin') {
      return targetUser.role !== 'superadmin';
    }
    
    // Admins can only change faculty and student roles
    if (currentUser.role === 'admin') {
      return targetUser.role === 'faculty' || targetUser.role === 'student';
    }
    
    return false;
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedUserId) {
      const success = await handleDeleteUser(selectedUserId);
      if (success) {
        closeDeleteDialog();
        setSelectedUserId(null);
      }
    }
  };
  
  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId);
    openDeleteDialog();
  };
  
  const handleEditClick = (userId: string) => {
    setEditMode(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };
  
  const userRoleColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'admin': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'faculty': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'student': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-full h-12" />
        ))}
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return <p className="text-center py-4 text-muted-foreground">No users found.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">User</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {editMode[user.id] ? (
                    <UserRoleSelector 
                      currentRole={user.role} 
                      onRoleChange={(newRole) => {
                        handleRoleChange(user.id, newRole);
                        setEditMode(prev => ({...prev, [user.id]: false}));
                      }}
                      disabled={!canChangeRole(user)}
                    />
                  ) : (
                    <Badge variant="outline" className={userRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(user.id)}
                      disabled={!canChangeRole(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(user.id)}
                      disabled={!canDelete(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersList;
