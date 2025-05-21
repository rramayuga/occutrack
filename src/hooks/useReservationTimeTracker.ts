
import { useRef } from 'react';

export function useReservationTimeTracker() {
  // This is a simplified version that doesn't rely on the reservation system
  // It simply returns empty arrays to prevent errors
  const lastProcessTime = useRef(Date.now());
  
  // Return empty values to maintain interface compatibility
  return {
    activeReservations: [],
    completedReservations: [],
    fetchActiveReservations: () => {
      console.log("Reservation system removed for faculty users");
      return Promise.resolve([]);
    }
  };
}
