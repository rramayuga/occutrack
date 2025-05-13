
// If this hook doesn't already exist, I'm creating a new one
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface ReservationRequest {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching reservations data...');
      
      let query = supabase
        .from('room_reservations')
        .select(`
          *,
          rooms!inner(
            name, 
            building_id
          ),
          buildings!inner(
            name
          )
        `);
        
      // If user is faculty, only fetch their reservations
      if (user.role === 'faculty') {
        query = query.eq('faculty_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedReservations: Reservation[] = data.map(item => ({
          id: item.id,
          roomId: item.room_id,
          facultyId: item.faculty_id,
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          purpose: item.purpose || '',
          status: item.status,
          roomNumber: item.rooms.name,
          building: item.buildings.name,
          buildingId: item.rooms.building_id
        }));
        
        // Sort by date and time
        formattedReservations.sort((a, b) => {
          // First compare dates
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA > dateB) return 1;
          if (dateA < dateB) return -1;
          
          // If dates are the same, compare start times
          return a.startTime.localeCompare(b.startTime);
        });
        
        console.log('Reservations fetched successfully:', formattedReservations.length);
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createReservation = useCallback(async (reservationData: ReservationRequest) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a reservation.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('room_reservations')
        .insert({
          room_id: reservationData.roomId,
          faculty_id: user.id,
          date: reservationData.date,
          start_time: reservationData.startTime,
          end_time: reservationData.endTime,
          purpose: reservationData.purpose,
          status: 'approved'
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Reservation Created",
        description: "Your room has been successfully reserved.",
      });
      
      await fetchReservations(); // Refresh reservations
      return data?.[0]?.id || null;
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Reservation Failed",
        description: "There was a problem creating your reservation. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, fetchReservations, toast]);

  // Function to explicitly refresh data
  const refreshReservations = useCallback(async () => {
    return fetchReservations();
  }, [fetchReservations]);

  // Initial data loading and subscription setup
  useEffect(() => {
    if (user) {
      fetchReservations();
      
      // Set up realtime subscription
      const reservationsChannel = supabase
        .channel('reservations-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'room_reservations' }, 
            (payload) => {
              console.log('Reservation change detected:', payload.eventType);
              fetchReservations();
            })
        .subscribe();
            
      return () => {
        supabase.removeChannel(reservationsChannel);
      };
    }
  }, [user, fetchReservations]);

  return { 
    reservations, 
    isLoading, 
    createReservation,
    refreshReservations
  };
};
