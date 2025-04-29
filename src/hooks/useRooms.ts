
import { useEffect } from 'react';
import { useBuildings } from './useBuildings';
import { useRoomFetching } from './rooms/useRoomFetching';
import { useRoomUpdater } from './rooms/useRoomUpdater';
import { useRoomSubscriptions } from './rooms/useRoomSubscriptions';
import { useRoomReservationCheck } from './useRoomReservationCheck';

/**
 * Main hook for managing room data and operations
 */
export function useRooms() {
  // Get building data
  const { 
    buildings, 
    selectedBuilding, 
    setSelectedBuilding,
  } = useBuildings();
  
  // Room fetching functionality
  const {
    rooms,
    setRooms,
    loading,
    fetchRooms,
    refetchRooms
  } = useRoomFetching();
  
  // Room updating functionality
  const {
    updateRoomAvailability,
    handleToggleRoomAvailability
  } = useRoomUpdater(rooms, setRooms, refetchRooms);
  
  // Room subscriptions for real-time updates
  const {
    setupRoomSubscription,
    setupRoomAvailabilitySubscription
  } = useRoomSubscriptions(fetchRooms, setRooms);
  
  // Check and update rooms based on reservations
  useRoomReservationCheck(rooms, updateRoomAvailability);

  // Set up subscriptions on component mount
  useEffect(() => {
    fetchRooms();
    
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription();
    
    return () => {
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, [fetchRooms, setupRoomSubscription, setupRoomAvailabilitySubscription]);

  return {
    buildings,
    rooms,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    handleToggleRoomAvailability,
    refetchRooms
  };
}
