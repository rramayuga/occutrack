
import React from 'react';
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserRole } from '@/lib/types';

interface UserRightsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: UserRole | 'all';
  setRoleFilter: (value: UserRole | 'all') => void;
  viewFilter: boolean;
  setViewFilter: (value: boolean) => void;
  editFilter: boolean;
  setEditFilter: (value: boolean) => void;
  deleteFilter: boolean;
  setDeleteFilter: (value: boolean) => void;
}

const UserRightsFilters: React.FC<UserRightsFiltersProps> = ({ 
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  viewFilter,
  setViewFilter,
  editFilter,
  setEditFilter,
  deleteFilter,
  setDeleteFilter
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="flex-1">
        <Input 
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
          <SelectTrigger>
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
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="view-filter"
            checked={viewFilter}
            onChange={(e) => setViewFilter(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="view-filter" className="text-sm">View</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit-filter"
            checked={editFilter}
            onChange={(e) => setEditFilter(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="edit-filter" className="text-sm">Edit</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="delete-filter"
            checked={deleteFilter}
            onChange={(e) => setDeleteFilter(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="delete-filter" className="text-sm">Delete</label>
        </div>
      </div>
    </div>
  );
};

export default UserRightsFilters;
