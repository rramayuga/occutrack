
import { useRef } from 'react';

export function useReservationTimeTracker() {
  // This hook now completely disables the reservation system for faculty users
  const lastProcessTime = useRef(Date.now());
  
  // Return empty values to maintain interface compatibility
  return {
    activeReservations: [],
    completedReservations: [],
    fetchActiveReservations: () => {
      console.log("Reservation system disabled for faculty users");
      return Promise.resolve([]);
    },
    processReservations: () => {
      console.log("Reservation processing disabled for faculty users");
      return Promise.resolve();
    },
    updateRoomStatus: () => {
      console.log("Room status updates disabled for faculty users");
      return Promise.resolve(false);
    },
    markReservationAsCompleted: () => {
      console.log("Reservation completion disabled for faculty users");
      return Promise.resolve(false);
    }
  };
}
