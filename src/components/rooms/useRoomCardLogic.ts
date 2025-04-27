
import { useAuth } from '@/lib/auth';
import { Room, Reservation } from '@/lib/types';
import { useRoomStatus } from '@/hooks/rooms/useRoomStatus';
import { useRoomOccupancy } from '@/hooks/rooms/useRoomOccupancy';
import { useRoomSchedules } from '@/hooks/rooms/useRoomSchedules';
import { useReservationManagement } from '@/hooks/rooms/useReservationManagement';

export const useRoomCardLogic = (room: Room, onToggleAvailability: (roomId: string) => void) => {
  const { user } = useAuth();
  
  const { getEffectiveStatus, handleStatusChange } = useRoomStatus(room, onToggleAvailability);
  const { currentOccupant: occupiedBy } = useRoomOccupancy(room.id, room.status !== 'occupied', room.occupiedBy);
  const { roomSchedules, showSchedules, handleToggleSchedules } = useRoomSchedules(room.id, room.name);
  const {
    isCancelDialogOpen,
    selectedReservation,
    handleCancelReservation,
    handleCancelClick,
    setIsCancelDialogOpen
  } = useReservationManagement();

  // Check if the current user is the faculty for a reservation
  const isUserFaculty = (reservation: Reservation) => {
    return user && user.role === 'faculty' && reservation.faculty === user.name;
  };

  return {
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
  };
};
