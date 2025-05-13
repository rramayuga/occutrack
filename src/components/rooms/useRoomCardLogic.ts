
import { useAuth } from '@/lib/auth';
import { Room, Reservation } from '@/lib/types';
import { useRoomStatus } from '@/hooks/rooms/useRoomStatus';
import { useRoomOccupancy } from '@/hooks/rooms/useRoomOccupancy';
import { useRoomSchedules } from '@/hooks/rooms/useRoomSchedules';
import { useReservationManagement } from '@/hooks/rooms/useReservationManagement';
import { useEffect } from 'react';

export const useRoomCardLogic = (room: Room, onToggleAvailability: (roomId: string) => void, refetchRooms: () => Promise<void>) => {
  const { user } = useAuth();
  
  const { getEffectiveStatus, handleStatusChange } = useRoomStatus(room, refetchRooms);
  const { currentOccupant: occupiedBy } = useRoomOccupancy(room.id, room.status !== 'occupied', room.occupiedBy);
  const { 
    roomSchedules, 
    showSchedules, 
    handleToggleSchedules,
    fetchRoomSchedules 
  } = useRoomSchedules(room.id, room.name);
  
  const {
    isCancelDialogOpen,
    selectedReservation,
    handleCancelReservation,
    handleCancelClick,
    setIsCancelDialogOpen
  } = useReservationManagement();

  // Refresh schedules more frequently
  useEffect(() => {
    if (showSchedules) {
      // Initial fetch
      fetchRoomSchedules();
      
      // Set up periodic refresh
      const intervalId = setInterval(() => {
        fetchRoomSchedules();
      }, 5000); // Every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [showSchedules, fetchRoomSchedules]);

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
