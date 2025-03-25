
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Settings } from 'lucide-react';
import { RoomStatus, UserRole } from '@/lib/types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface RoomActionsProps {
  canModifyRooms: boolean;
  showSchedules: boolean;
  status: RoomStatus;
  userRole?: UserRole;
  onToggleSchedules: (e: React.MouseEvent) => void;
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
  const isAdminOrSuperAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  return (
    <>
      {canModifyRooms && (
        <div className="w-full mb-2">
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as RoomStatus)}
          >
            <SelectTrigger className="w-full text-xs">
              <Settings className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Mark as Available</SelectItem>
              <SelectItem value="occupied">Mark as Occupied</SelectItem>
              {isAdminOrSuperAdmin && (
                <SelectItem value="maintenance">Mark as Under Maintenance</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={onToggleSchedules}
      >
        <Calendar className="h-3 w-3 mr-1" />
        {showSchedules ? 'Hide Schedule' : 'View Schedule'}
      </Button>
    </>
  );
};

export default RoomActions;
