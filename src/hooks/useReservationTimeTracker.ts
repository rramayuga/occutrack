
import { useRef, useEffect, useCallback } from 'react';
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
  
  // Process reservations on a fixed interval and update the UI accordingly
  const processAndUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastProcessTime.current > 30000) { // 30 seconds between checks for faster updates
      console.log("Processing reservations in useReservationTimeTracker");
      processReservations();
      lastProcessTime.current = now;
    }
  }, [processReservations]);
  
  // Set up an effect to process reservations on mount and at regular intervals
  useEffect(() => {
    console.log("Setting up reservation tracking in useReservationTimeTracker");
    
    // Initial processing
    processAndUpdate();
    
    // Set up a more frequent interval for better responsiveness
    const intervalId = setInterval(() => {
      processAndUpdate();
    }, 30000); // Check every 30 seconds for more responsive status updates
    
    return () => clearInterval(intervalId);
  }, [processAndUpdate]);

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations
  };
}
