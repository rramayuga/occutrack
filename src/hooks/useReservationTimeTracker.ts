
import { useRef, useEffect } from 'react';
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
  
  // Set up an effect to process reservations only once on mount
  // This prevents excessive processing on every render
  useEffect(() => {
    // Only process if it's been at least 2 minutes since last check
    const now = Date.now();
    if (now - lastProcessTime.current > 120000) { // Increased to 2 minutes
      console.log("Processing reservations in useReservationTimeTracker (initial setup)");
      processReservations();
      lastProcessTime.current = now;
      
      // Set up a minimum 2 minute interval for processing
      const intervalId = setInterval(() => {
        const currentTime = Date.now();
        // Prevent processing more frequently than once per 2 minutes
        if (currentTime - lastProcessTime.current > 120000) { // 2 minute minimum (increased)
          console.log("Processing reservations in useReservationTimeTracker (interval)");
          processReservations();
          lastProcessTime.current = currentTime;
        }
      }, 120000); // Check every 2 minutes (increased from 1 minute)
      
      return () => clearInterval(intervalId);
    }
  }, [processReservations]);

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations
  };
}
