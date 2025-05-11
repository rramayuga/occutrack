
import { useAuth } from '@/lib/auth';
import { Room, Reservation } from '@/lib/types';
import { useRoomStatus } from '@/hooks/rooms/useRoomStatus';
import { useRoomOccupancy } from '@/hooks/rooms/useRoomOccupancy';
import { useRoomSchedules } from '@/hooks/rooms/useRoomSchedules';
import { useReservationManagement } from '@/hooks/rooms/useReservationManagement';

export const useRoomCardLogic = (room: Room, onToggleAvailability: (roomId: string) => void, refetchRooms: () => Promise<void>) => {
  const { user } = useAuth();
  
  // Update this line to match the actual return values from useRoomStatus
  const { updateRoomStatus, isUpdating } = useRoomStatus(room, refetchRooms);
  const { currentOccupant: occupiedBy } = useRoomOccupancy(room.id, room.status !== 'occupied', room.occupiedBy);
  const { roomSchedules, showSchedules, handleToggleSchedules, fetchRoomSchedules } = useRoomSchedules(room.id, room.name);
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
  
  // Create adapter functions to maintain compatibility with existing code
  const getEffectiveStatus = () => room.status;
  const handleStatusChange = (newStatus: "available" | "occupied" | "maintenance") => {
    return updateRoomStatus(room, newStatus);
  };

  return {
    occupiedBy,
    roomSchedules,
    showSchedules,
    isCancelDialogOpen,
    selectedReservation,
    isUpdating,
    getEffectiveStatus,
    handleStatusChange,
    handleCancelReservation,
    handleToggleSchedules,
    handleCancelClick,
    isUserFaculty,
    setIsCancelDialogOpen,
    fetchRoomSchedules
  };
};
