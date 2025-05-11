
import React from 'react';
import { UserRole } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRightsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: UserRole | 'all';
  setRoleFilter: (role: UserRole | 'all') => void;
}

const UserRightsFilters: React.FC<UserRightsFiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  roleFilter, 
  setRoleFilter 
}) => {
  return (
    <div className="flex items-center gap-4 my-4">
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1"
      />
      <Select 
        value={roleFilter} 
        onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="faculty">Faculty</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="superadmin">Super Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserRightsFilters;
