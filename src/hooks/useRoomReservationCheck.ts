
import { useEffect, useRef, useState } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const lastUpdateRef = useRef<Record<string, string>>({});
  const processedReservationsRef = useRef<Set<string>>(new Set());
  const updateInProgressRef = useRef<boolean>(false);
  const updateQueuedRef = useRef<boolean>(false);

  // Set up subscription for real-time updates - this hook now only fetches reservations
  // but doesn't update room statuses (that's handled by useStatusUpdater)
  useEffect(() => {
    // Set up one shared subscription channel for all reservation-related events
    const reservationChannel = supabase
      .channel('room_reservation_check')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations' 
      }, (payload) => {
        console.log('[RESERVATION-CHECK] Reservation change detected:', payload);
        fetchCurrentReservations();
      })
      .subscribe();
    
    // Initial fetch of reservations
    fetchCurrentReservations();
    
    return () => {
      supabase.removeChannel(reservationChannel);
    };
  }, [rooms, user]);

  // Function to fetch current reservations
  const fetchCurrentReservations = async () => {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('date', currentDate);
      
      if (error) {
        console.error("[RESERVATION-CHECK] Error fetching reservations:", error);
        return;
      }
      
      if (data) {
        console.log(`[RESERVATION-CHECK] Fetched ${data.length} reservations for today`);
        setReservations(data);
      }
    } catch (error) {
      console.error("[RESERVATION-CHECK] Error in fetchCurrentReservations:", error);
    }
  };

  return { reservations };
}
