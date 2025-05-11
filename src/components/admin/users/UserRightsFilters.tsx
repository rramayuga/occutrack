
import React from 'react';
import { UserRole } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit, Filter } from "lucide-react";

interface UserRightsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: UserRole | 'all';
  setRoleFilter: (role: UserRole | 'all') => void;
  onExportUsers?: () => void;
  onEditRoles?: () => void;
  onDeleteRoles?: () => void;
}

const UserRightsFilters: React.FC<UserRightsFiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  roleFilter, 
  setRoleFilter,
  onExportUsers,
  onEditRoles,
  onDeleteRoles
}) => {
  return (
    <div className="flex flex-col gap-4 my-4">
      <div className="flex items-center gap-4">
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
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportUsers}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditRoles}
          className="flex items-center gap-1"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Roles</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteRoles}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Roles</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </Button>
      </div>
    </div>
  );
};

export default UserRightsFilters;
