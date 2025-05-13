
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useReservationCompleter() {
  const [completedReservations, setCompletedReservations] = useState<string[]>([]);
  const { toast } = useToast();

  // Mark a reservation as completed
  const markReservationAsCompleted = async (reservationId: string) => {
    try {
      // Add this reservation ID to our completed list to avoid re-processing
      setCompletedReservations(prev => [...prev, reservationId]);
      
      // Update the status of the reservation to 'completed' in the database
      const { error } = await supabase
        .from('room_reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);
      
      if (error) throw error;
      
      toast({
        title: "Reservation Completed",
        description: "Your reservation has ended and the room is now available.",
      });
      
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
