
import React, { memo, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Lock } from 'lucide-react';
import { Room } from '@/lib/types';
import RoomCardHeader from './RoomCardHeader';
import RoomScheduleList from './RoomScheduleList';
import RoomActions from './RoomActions';
import CancelReservationDialog from './CancelReservationDialog';
import { useRoomCardLogic } from './useRoomCardLogic';
import { useAuth } from '@/lib/auth';

export interface RoomCardProps {
  room: Room;
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
  onSelectRoom?: () => void;
  refetchRooms: () => Promise<void>;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  canModifyRooms, 
  onToggleAvailability,
  onSelectRoom,
  refetchRooms
}) => {
  const { user } = useAuth();
  const {
    occupiedBy,
    roomSchedules,
    showSchedules,
    isCancelDialogOpen,
    selectedReservation,
    getEffectiveStatus,
    handleStatusChange,
    handleCancelReservation,
    handleToggleSchedules,
    handleCancelClick,
    isUserFaculty,
    setIsCancelDialogOpen
  } = useRoomCardLogic(room, onToggleAvailability, refetchRooms);

  // Force refresh of schedules periodically to remove expired bookings
  useEffect(() => {
    // This will be handled by the useRoomCardLogic hook's internal refresh mechanism
  }, []);

  const handleCardClick = () => {
    // Don't allow selection of maintenance rooms for non-superadmins
    if (room.status === 'maintenance' && user?.role !== 'superadmin') {
      return;
    }
    
    if (onSelectRoom) {
      onSelectRoom();
    }
  };

  const status = getEffectiveStatus();
  const isSuperAdmin = user?.role === 'superadmin';
  
  // User can modify rooms if:
  // 1. They have general permission AND room is not in maintenance, OR
  // 2. They are a superadmin (can modify any room)
  const userCanModifyRooms = (canModifyRooms && status !== 'maintenance') || isSuperAdmin;

  return (
    <>
      <Card 
        className={`hover:shadow-md transition-shadow ${onSelectRoom && (status !== 'maintenance' || isSuperAdmin) ? 'cursor-pointer' : ''} ${
          status === 'maintenance' ? 'border-amber-200 bg-amber-50' : 
          status === 'occupied' ? 'border-red-200' : ''
        }`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <RoomCardHeader 
            name={room.name}
            occupiedBy={occupiedBy}
            status={status}
          />
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>{room.type}</div>
            <div>Capacity: {room.capacity || 30}</div>
          </div>
        </CardContent>
        <CardFooter className="pt-1 flex flex-col">
          {!userCanModifyRooms && (
            <div className="text-xs text-muted-foreground flex items-center mb-2 w-full justify-center">
              <Lock className="h-3 w-3 mr-1" />
              {status === 'maintenance' ? 'Under maintenance - SuperAdmin only' : 
               status === 'occupied' ? 'Currently in use' : 'Ready for use'}
            </div>
          )}
          
          <RoomActions 
            canModifyRooms={userCanModifyRooms}
            showSchedules={showSchedules}
            status={status}
            userRole={user?.role}
            onToggleSchedules={handleToggleSchedules}
            onStatusChange={handleStatusChange}
          />
        </CardFooter>
        
        {/* Don't show schedules for maintenance rooms to non-superadmins */}
        {(status !== 'maintenance' || isSuperAdmin) && (
          <RoomScheduleList 
            roomSchedules={roomSchedules}
            showSchedules={showSchedules}
            isUserFaculty={isUserFaculty}
            onCancelClick={handleCancelClick}
          />
        )}
      </Card>
      
      <CancelReservationDialog
        open={isCancelDialogOpen}
        setOpen={setIsCancelDialogOpen}
        reservation={selectedReservation}
        roomName={room.name}
        onConfirmCancel={handleCancelReservation}
      />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(RoomCard);
