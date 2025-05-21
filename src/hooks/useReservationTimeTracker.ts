
import { useRef, useEffect } from 'react';
import { useReservationStatusManager } from './reservation/useReservationStatusManager';

export function useReservationTimeTracker() {
  // This hook is a wrapper around our centralized status manager
  // to maintain backward compatibility with existing components
  const { 
    activeReservations,
    completedReservationIds, 
    fetchActiveReservations,
  } = useReservationStatusManager();
  
  // Track if we've already processed reservations this render cycle
  // and when the last processing happened
  const lastProcessTime = useRef(Date.now());
  
  // Set up an effect to process reservations only once on mount
  useEffect(() => {
    // Only fetch if it's been at least 2 minutes since last check
    const now = Date.now();
    if (now - lastProcessTime.current > 120000) { // 2 minutes
      console.log("Fetching reservations in useReservationTimeTracker (initial setup)");
      fetchActiveReservations();
      lastProcessTime.current = now;
      
      // Set up a minimum 2 minute interval for fetching
      const intervalId = setInterval(() => {
        const currentTime = Date.now();
        // Prevent processing more frequently than once per 2 minutes
        if (currentTime - lastProcessTime.current > 120000) { // 2 minute minimum
          console.log("Fetching reservations in useReservationTimeTracker (interval)");
          fetchActiveReservations();
          lastProcessTime.current = currentTime;
        }
      }, 120000); // Check every 2 minutes
      
      return () => clearInterval(intervalId);
    }
  }, [fetchActiveReservations]);

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations
  };
}
