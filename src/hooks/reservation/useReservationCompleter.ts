
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useReservationCompleter() {
  const [completedReservations, setCompletedReservations] = useState<string[]>([]);
  const { toast } = useToast();

  // Mark a reservation as completed
  const markReservationAsCompleted = async (reservationId: string) => {
    try {
      console.log(`Marking reservation ${reservationId} as completed`);
      
      if (!reservationId) {
        console.error("Cannot complete reservation: Missing reservationId");
        return false;
      }
      
      // Check if already completed to avoid duplicate operations
      if (completedReservations.includes(reservationId)) {
        console.log(`Reservation ${reservationId} is already in completed list, skipping`);
        return true;
      }
      
      // Update the status of the reservation to 'completed' in the database
      // This is crucial for analytics tracking in Admin
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) {
        console.error("Error marking reservation as completed:", error);
        return false;
      }
      
      // Add this reservation ID to our completed list to avoid re-processing
      setCompletedReservations(prev => [...prev, reservationId]);
      
      console.log(`Successfully marked reservation ${reservationId} as completed in database`);
      
      return true;
    } catch (error) {
      console.error("Error marking reservation as completed:", error);
      return false;
    }
  };

  return { 
    completedReservations,
    markReservationAsCompleted 
  };
}
