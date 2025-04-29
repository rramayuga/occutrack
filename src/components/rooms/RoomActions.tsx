
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Lock, Unlock } from 'lucide-react';
import { RoomStatus, UserRole } from '@/lib/types';

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
  
  // On maintenance, only show actions to superadmin for status changes
  // But everyone can still view the schedule
  return (
    <div className="flex gap-2 w-full">
      <Button 
        variant="outline" 
        size="sm"
        className="flex-1"
        onClick={onToggleSchedules}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {showSchedules ? 'Hide Schedule' : 'View Schedule'}
      </Button>
      
      {canModifyRooms && (
        <div className="flex gap-2">
          {status !== 'maintenance' && (
            <Button
              variant={status === 'available' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => onStatusChange(status === 'available' ? 'occupied' : 'available')}
            >
              {status === 'available' ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Mark as Occupied
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Mark as Available
                </>
              )}
            </Button>
          )}
          
          {/* Only superadmins can set/unset maintenance mode */}
          {isSuperAdmin && (
            <Button
              variant={status === 'maintenance' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(status === 'maintenance' ? 'available' : 'maintenance')}
            >
              {status === 'maintenance' ? 'End Maintenance' : 'Set Maintenance'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomActions;
