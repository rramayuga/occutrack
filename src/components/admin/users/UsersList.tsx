
import React from 'react';
import { User, UserRole } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleSelector from './UserRoleSelector';
import { useAuth } from '@/lib/auth';
import { Checkbox } from "@/components/ui/checkbox";

interface UsersListProps {
  users: User[];
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
  selectedUsers?: string[];
  toggleUserSelection?: (userId: string) => void;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users,
  loading,
  filteredUsers,
  handleRoleChange,
  selectedUsers = [],
  toggleUserSelection
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const hasSelectionFeature = !!toggleUserSelection;

  return (
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
          <div className={`grid ${hasSelectionFeature ? 'grid-cols-4' : 'grid-cols-3'} font-medium p-3 border-b`}>
            {hasSelectionFeature && <div className="flex items-center justify-center">Select</div>}
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
          </div>
          {filteredUsers.map((user) => (
            <div key={user.id} className={`grid ${hasSelectionFeature ? 'grid-cols-4' : 'grid-cols-3'} p-3 border-b items-center ${
              selectedUsers.includes(user.id) ? 'bg-muted/20' : ''
            }`}>
              {hasSelectionFeature && (
                <div className="flex items-center justify-center">
                  <Checkbox 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUserSelection?.(user.id)}
                  />
                </div>
              )}
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
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
};

export default UsersList;
