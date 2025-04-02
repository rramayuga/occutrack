
import React from 'react';
import { User, UserRole } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleSelector from './UserRoleSelector';

interface UsersListProps {
  users: User[];
  loading: boolean;
  filteredUsers: User[];
  handleRoleChange: (userId: string, newRole: UserRole) => void;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users,
  loading,
  filteredUsers,
  handleRoleChange
}) => {
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
          <div className="grid grid-cols-3 font-medium p-3 border-b">
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
          </div>
          {filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-3 p-3 border-b items-center">
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
