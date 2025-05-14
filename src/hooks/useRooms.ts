
import { useEffect, useRef, useMemo } from 'react';
import { useBuildings } from './useBuildings';
import { useRoomFetching } from './rooms/useRoomFetching';
import { useRoomUpdater } from './rooms/useRoomUpdater';
import { useRoomSubscriptions } from './rooms/useRoomSubscriptions';
import { useRoomReservationCheck } from './useRoomReservationCheck';
import { useStatusUpdater } from './useStatusUpdater';

/**
 * Main hook for managing room data and operations, optimized to reduce rerenders
 */
export function useRooms() {
  // Track initial setup to prevent multiple setups
  const isInitialSetup = useRef(true);
  const subscriptionsSetUp = useRef(false);

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
  
  // Memoize the room updater functions to prevent unnecessary recreations
  const {
    updateRoomAvailability,
    handleToggleRoomAvailability
  } = useRoomUpdater(rooms, setRooms, refetchRooms);
  
  // Use memoized subscription setup to prevent recreation
  const {
    setupRoomSubscription,
    setupRoomAvailabilitySubscription
  } = useRoomSubscriptions(fetchRooms, setRooms);
  
  // Check and update rooms based on reservations - optimized version
  useRoomReservationCheck(rooms, updateRoomAvailability);
  
  // Additional aggressive status updater - optimized version
  useStatusUpdater(rooms, updateRoomAvailability);

  // Set up subscriptions just once on component mount
  useEffect(() => {
    // Only set up subscriptions once
    if (isInitialSetup.current && !subscriptionsSetUp.current) {
      console.log("Setting up initial room data and subscriptions");
      
      // Set the flag immediately to prevent duplicate setups
      subscriptionsSetUp.current = true;
      
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
  }, []);

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
