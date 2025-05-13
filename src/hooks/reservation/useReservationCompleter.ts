
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function useReservationCompleter() {
  const [completedReservations, setCompletedReservations] = useState<string[]>([]);
  
  // Function to mark reservation as completed
  const markReservationAsCompleted = async (reservationId: string) => {
    try {
      console.log(`Marking reservation ${reservationId} as completed`);
      
      // Skip if already marked as completed in our local state
      if (completedReservations.includes(reservationId)) {
        console.log(`Reservation ${reservationId} already marked as completed locally`);
        return true;
      }
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      // Add the reservation ID to completed list to avoid duplicate completion
      setCompletedReservations(prev => [...prev, reservationId]);
      
      return true;
    } catch (error) {
      console.error("Error in markReservationAsCompleted:", error);
      return false;
    }
  };
  
  return { 
    completedReservations,
    markReservationAsCompleted 
  };
}
