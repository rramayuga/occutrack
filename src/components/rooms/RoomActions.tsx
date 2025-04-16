
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Settings, ShieldAlert, Wrench } from 'lucide-react';
import { RoomStatus, UserRole } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: RoomStatus) => {
    try {
      // If superadmin sets room to maintenance, create announcement
      if (userRole === 'superadmin' && newStatus === 'maintenance') {
        const { error: announcementError } = await supabase
          .from('announcements')
          .insert([{
            title: "Room Under Maintenance",
            content: `Room is now under maintenance. Please note that this room will be temporarily unavailable for reservations.`,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (announcementError) throw announcementError;

        toast({
          title: "Room Status Updated",
          description: "Room has been marked as under maintenance and announcement has been posted.",
        });
      }

      // Call the original onStatusChange
      onStatusChange(newStatus);
    } catch (error) {
      console.error("Error updating room status:", error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      {canModifyRooms && (
        <div className="w-full mb-2">
          <Select
            value={status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full text-xs">
              <Settings className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Mark as Available</SelectItem>
              <SelectItem value="occupied">Mark as Occupied</SelectItem>
              {userRole === 'superadmin' && (
                <SelectItem value="maintenance">
                  <div className="flex items-center">
                    <Wrench className="h-4 w-4 mr-1 text-amber-500" />
                    <span>Mark as Under Maintenance</span>
                  </div>
                </SelectItem>
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
