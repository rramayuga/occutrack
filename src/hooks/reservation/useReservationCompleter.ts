
import { supabase } from "@/integrations/supabase/client";

export function useReservationCompleter() {
  const completedReservations: string[] = [];
  
  // Function to mark reservation as completed
  const markReservationAsCompleted = async (reservationId: string) => {
    try {
      console.log(`Marking reservation ${reservationId} as completed`);
      
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      // Add the reservation ID to completed list to avoid duplicate completion
      if (!completedReservations.includes(reservationId)) {
        completedReservations.push(reservationId);
      }
      
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
