
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';
import { RoomStatus, UserRole } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoomActionsProps {
  canModifyRooms: boolean;
  showSchedules: boolean;
  status: RoomStatus;
  userRole?: UserRole;
  onToggleSchedules: () => void;
  onStatusChange: (status: RoomStatus) => void;
}

const RoomActions: React.FC<RoomActionsProps> = ({
  canModifyRooms,
  showSchedules,
  status,
  userRole,
  onToggleSchedules,
  onStatusChange
}) => {
  const isMaintenanceMode = status === 'maintenance';
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const isFaculty = userRole === 'faculty';
  
  // Faculty members should not be able to change room status
  // Fix: Change the comparison to use isFaculty variable for proper type checking
  const canChangeStatus = canModifyRooms && (isSuperAdmin || isAdmin) && !isFaculty;
  
  return (
    <div className="flex gap-2 w-full">
      <Button 
        variant="outline" 
        size="sm"
        className="flex-1"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSchedules();
        }}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {showSchedules ? 'Hide Schedule' : 'View Schedule'}
      </Button>
      
      {canChangeStatus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status !== 'maintenance' && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(status === 'available' ? 'occupied' : 'available');
                }}
              >
                {status === 'available' ? 'Mark as Occupied' : 'Mark as Available'}
              </DropdownMenuItem>
            )}
            
            {/* Only superadmins can set/unset maintenance mode */}
            {isSuperAdmin && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(status === 'maintenance' ? 'available' : 'maintenance');
                }}
                className={status === 'maintenance' ? 'text-red-500' : ''}
              >
                {status === 'maintenance' ? 'End Maintenance' : 'Set Maintenance'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default RoomActions;
