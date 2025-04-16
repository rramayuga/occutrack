
import { useState } from 'react';
import { Reservation } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useReservationManagement = () => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { toast } = useToast();

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      const { error } = await supabase
        .from('room_reservations')
        .delete()
        .eq('id', selectedReservation.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reservation Cancelled",
        description: "Your room reservation has been cancelled successfully.",
      });
      
      setIsCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelClick = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setIsCancelDialogOpen(true);
  };

  return {
    isCancelDialogOpen,
    selectedReservation,
    handleCancelReservation,
    handleCancelClick,
    setIsCancelDialogOpen
  };
};
