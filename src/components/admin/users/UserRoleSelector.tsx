
import React from 'react';
import { UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  return (
    <Select 
      defaultValue={currentRole} 
      onValueChange={(value) => onRoleChange(value as UserRole)}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="faculty">Faculty</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="superadmin">Super Admin</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default UserRoleSelector;
