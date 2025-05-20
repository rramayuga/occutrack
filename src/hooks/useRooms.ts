
import { useState, useEffect, useRef } from 'react';
import { useBuildings } from './useBuildings';
import { useRoomFetching } from './rooms/useRoomFetching';
import { useRoomUpdater } from './rooms/useRoomUpdater';
import { useRoomSubscriptions } from './rooms/useRoomSubscriptions';
import { useRoomReservationCheck } from './useRoomReservationCheck';

/**
 * Main hook for managing room data and operations
 */
export function useRooms() {
  // Track initial setup to prevent multiple setups
  const isInitialized = useRef(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');

  // Get building data
  const { buildings } = useBuildings();
  
  // Room fetching functionality
  const {
    rooms,
    setRooms,
    loading: isLoading,
    fetchRooms,
    refetchRooms: refreshRooms
  } = useRoomFetching();
  
  // Room updating functionality
  const {
    updateRoomAvailability,
    handleToggleRoomAvailability
  } = useRoomUpdater(rooms, setRooms, refreshRooms);
  
  // Room subscriptions for real-time updates
  const {
    setupRoomSubscription,
    setupRoomAvailabilitySubscription
  } = useRoomSubscriptions(fetchRooms, setRooms);
  
  // Check and update rooms based on reservations - this helps catch any misalignment
  useRoomReservationCheck(rooms, updateRoomAvailability);

  // Set up subscriptions on component mount - only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    console.log("Setting up initial room data and subscriptions");
    
    // Initial data fetch
    fetchRooms();
    
    // Set up real-time subscription channels
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription();
    
    isInitialized.current = true;
    
    // Clean up subscriptions on unmount
    return () => {
      console.log("Cleaning up room subscriptions");
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, [fetchRooms, setupRoomSubscription, setupRoomAvailabilitySubscription]);

  return {
    buildings,
    rooms,
    isLoading,
    selectedBuilding,
    setSelectedBuilding,
    handleToggleRoomAvailability,
    refreshRooms
  };
}
