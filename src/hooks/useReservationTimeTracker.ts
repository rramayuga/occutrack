
import { useRef } from 'react';
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
  
  // Process reservations only once per render cycle and with a cooldown
  if (!processedThisRender.current) {
    const now = Date.now();
    // Only process if it's been at least 5 seconds since last check
    if (now - lastProcessTime.current > 5000) {
      processReservations();
      lastProcessTime.current = now;
      processedThisRender.current = true;
      
      // Reset flag after a longer delay (10 seconds) to reduce processing frequency
      setTimeout(() => {
        processedThisRender.current = false;
      }, 10000);
    }
  }

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations
  };
}
