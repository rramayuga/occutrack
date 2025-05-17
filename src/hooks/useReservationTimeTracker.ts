
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
  const processedThisRender = useRef(false);
  
  // Process reservations only once per render cycle
  if (!processedThisRender.current) {
    processReservations();
    processedThisRender.current = true;
    
    // Reset flag after a short delay to allow future processing
    setTimeout(() => {
      processedThisRender.current = false;
    }, 3000); // Wait 3 seconds before allowing another process
  }

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations
  };
}
