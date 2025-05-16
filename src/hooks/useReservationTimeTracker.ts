
import { useReservationStatusManager } from './useReservationStatusManager';

export function useReservationTimeTracker() {
  // This hook is now just a thin wrapper around our centralized status manager
  // to maintain backward compatibility with existing components
  const { 
    activeReservations,
    completedReservationIds, 
    fetchActiveReservations
  } = useReservationStatusManager();

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations
  };
}
