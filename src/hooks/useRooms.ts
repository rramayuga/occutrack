
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
  const lastProcessTime = useRef<number>(Date.now());
  const lastFetchTime = useRef<number>(Date.now());
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const maxRetries = useRef(3);
  const retryCount = useRef(0);
  const retryTimeoutId = useRef<number | null>(null);

  // Get building data
  const { buildings } = useBuildings();
  
  // Room fetching functionality
  const {
    rooms,
    setRooms,
    loading: isLoading,
    fetchRooms,
    refetchRooms: refreshRooms,
    hasError
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

  // Update connection error state 
  useEffect(() => {
    setConnectionError(hasError);
  }, [hasError]);

  // Set up subscriptions on component mount - only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    console.log("Setting up initial room data and subscriptions");
    
    // Create retry mechanism with exponential backoff
    const fetchWithRetry = async () => {
      try {
        await fetchRooms();
        // Reset retry counter on success
        retryCount.current = 0;
        setConnectionError(false);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setConnectionError(true);
        
        // Implement retry logic with exponential backoff
        if (retryCount.current < maxRetries.current) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000); // Cap at 30 seconds
          console.log(`Retrying room fetch in ${delay}ms (attempt ${retryCount.current + 1}/${maxRetries.current})`);
          
          // Clear any existing timeout
          if (retryTimeoutId.current) {
            window.clearTimeout(retryTimeoutId.current);
          }
          
          retryTimeoutId.current = window.setTimeout(fetchWithRetry, delay) as unknown as number;
          retryCount.current++;
        }
      }
    };
    
    // Initial data fetch with retry mechanism
    fetchWithRetry();
    
    // Set up real-time subscription channels
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription();
    
    isInitialized.current = true;
    
    // Clean up subscriptions and timeouts on unmount
    return () => {
      console.log("Cleaning up room subscriptions");
      unsubscribeRooms();
      unsubscribeAvailability();
      
      if (retryTimeoutId.current) {
        window.clearTimeout(retryTimeoutId.current);
      }
    };
  }, [fetchRooms, setupRoomSubscription, setupRoomAvailabilitySubscription]);

  return {
    buildings,
    rooms,
    isLoading,
    connectionError,
    selectedBuilding,
    setSelectedBuilding,
    handleToggleRoomAvailability,
    refreshRooms
  };
}
