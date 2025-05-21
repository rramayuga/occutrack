
import { useAuth } from '@/lib/auth';
import { Room, Reservation } from '@/lib/types';
import { useRoomStatus } from '@/hooks/rooms/useRoomStatus';
import { useRoomOccupancy } from '@/hooks/rooms/useRoomOccupancy';
import { useRoomSchedules } from '@/hooks/rooms/useRoomSchedules';

export const useRoomCardLogic = (room: Room, onToggleAvailability: (roomId: string) => void, refetchRooms: () => Promise<void>) => {
  const { user } = useAuth();
  
  const { getEffectiveStatus, handleStatusChange } = useRoomStatus(room, refetchRooms);
  const { currentOccupant: occupiedBy } = useRoomOccupancy(room.id, room.status !== 'occupied', room.occupiedBy);
  const { roomSchedules, showSchedules, handleToggleSchedules } = useRoomSchedules(room.id, room.name);

  // Check if the current user is the faculty for a reservation
  const isUserFaculty = (reservation: Reservation) => {
    return user && user.role === 'faculty' && reservation.faculty === user.name;
  };

  // Provide empty values for reservation-related fields to maintain interface compatibility
  const isCancelDialogOpen = false;
  const selectedReservation = null;
  const handleCancelReservation = async () => { console.log("Reservation cancellation disabled"); return; };
  const handleCancelClick = () => { console.log("Reservation cancellation disabled"); };
  const setIsCancelDialogOpen = () => { console.log("Dialog functionality disabled"); };

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
