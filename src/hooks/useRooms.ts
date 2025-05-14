
import { useEffect, useRef } from 'react';
import { useBuildings } from './useBuildings';
import { useRoomFetching } from './rooms/useRoomFetching';
import { useRoomUpdater } from './rooms/useRoomUpdater';
import { useRoomSubscriptions } from './rooms/useRoomSubscriptions';
import { useRoomReservationCheck } from './useRoomReservationCheck';
import { useStatusUpdater } from './useStatusUpdater';

/**
 * Main hook for managing room data and operations
 */
export function useRooms() {
  // Track initial setup to prevent multiple setups
  const isInitialSetup = useRef(true);

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
  
  // Additional aggressive status updater
  useStatusUpdater(rooms, updateRoomAvailability);

  // Set up subscriptions on component mount
  useEffect(() => {
    // Only set up subscriptions on initial mount
    if (isInitialSetup.current) {
      console.log("Setting up initial room data and subscriptions");
      
      // Initial data fetch
      fetchRooms();
      
      // Set up real-time subscription channels
      const unsubscribeRooms = setupRoomSubscription();
      const unsubscribeAvailability = setupRoomAvailabilitySubscription();
      
      isInitialSetup.current = false;
      
      // Clean up subscriptions on unmount
      return () => {
        console.log("Cleaning up room subscriptions");
        unsubscribeRooms();
        unsubscribeAvailability();
      };
    }
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
