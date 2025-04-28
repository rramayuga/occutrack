
import React from 'react';
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

  const handleCardClick = () => {
    if (onSelectRoom) {
      onSelectRoom();
    }
  };

  const status = getEffectiveStatus();
  const isSuperAdmin = user?.role === 'superadmin';
  const userCanModifyRooms = canModifyRooms || isSuperAdmin;

  return (
    <>
      <Card 
        className={`hover:shadow-md transition-shadow ${onSelectRoom ? 'cursor-pointer' : ''} ${
          status === 'maintenance' ? 'border-amber-200' : 
          status === 'occupied' ? 'border-red-200' : ''
        }`}
        onClick={onSelectRoom ? handleCardClick : undefined}
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
              {status === 'maintenance' ? 'Under maintenance' : 
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
        
        <RoomScheduleList 
          roomSchedules={roomSchedules}
          showSchedules={showSchedules}
          isUserFaculty={isUserFaculty}
          onCancelClick={handleCancelClick}
        />
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

export default RoomCard;
