
import { useRef, useEffect, useCallback, useState } from 'react';
import { useReservationStatusManager } from './reservation/useReservationStatusManager';

export function useReservationTimeTracker() {
  // This hook is a wrapper around our centralized status manager
  // to maintain backward compatibility with existing components
  const { 
    activeReservations,
    completedReservationIds, 
    fetchActiveReservations,
    processReservations
  } = useReservationStatusManager();
  
  // Track if we've already processed reservations this render cycle
  // and when the last processing happened
  const processedThisRender = useRef(false);
  const lastProcessTime = useRef(Date.now());
  const [connectionError, setConnectionError] = useState(false);
  
  // Process reservations on a fixed interval and update the UI accordingly
  const processAndUpdate = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastProcessTime.current > 10000) { // 10 seconds between checks for faster updates
        console.log("Processing reservations in useReservationTimeTracker");
        await processReservations();
        lastProcessTime.current = now;
        
        // Clear any previous connection error state if successful
        if (connectionError) {
          setConnectionError(false);
        }
      }
    } catch (error) {
      console.error("Error in processAndUpdate:", error);
      setConnectionError(true);
      
      // If we have connection errors, we'll try again later
      // but we won't spam with too many retries
    }
  }, [processReservations, connectionError]);
  
  // Set up an effect to process reservations on mount and at regular intervals
  useEffect(() => {
    console.log("Setting up reservation tracking in useReservationTimeTracker");
    
    // Initial processing - wrapped in try/catch for resilience
    const initialSetup = async () => {
      try {
        await fetchActiveReservations();
        await processAndUpdate();
      } catch (error) {
        console.error("Error during initial reservation setup:", error);
        setConnectionError(true);
      }
    };
    
    initialSetup();
    
    // Set up a more frequent interval for better responsiveness
    const intervalId = setInterval(() => {
      processAndUpdate();
    }, 10000); // Check every 10 seconds for more responsive status updates
    
    return () => clearInterval(intervalId);
  }, [fetchActiveReservations, processAndUpdate]);

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations,
    connectionError
  };
}
