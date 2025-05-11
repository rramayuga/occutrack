
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { Reservation, ReservationFormValues } from '@/lib/types';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's reservations
  const fetchReservations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all reservations for the current faculty
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          purpose,
          status,
          rooms (name, building_id),
          buildings:rooms!inner (building_id)
        `)
        .eq('faculty_id', user.id);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Additional query to get building names
        const buildingIds = [...new Set(data.map(item => item.rooms.building_id))];
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds);
          
        if (buildingsError) throw buildingsError;
        
        // Create a mapping of building ids to names
        const buildingNames: {[key: string]: string} = {};
        if (buildingsData) {
          buildingsData.forEach(building => {
            buildingNames[building.id] = building.name;
          });
        }
        
        // Format times to 12-hour format (AM/PM)
        const formatTimeTo12Hour = (time: string): string => {
          const [hours, minutes] = time.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12; // Convert 0 to 12
          return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        // Transform the data
        const transformedReservations: Reservation[] = data.map(item => ({
          id: item.id,
          roomId: item.room_id,
          roomNumber: item.rooms.name,
          building: buildingNames[item.rooms.building_id] || 'Unknown Building',
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          displayStartTime: formatTimeTo12Hour(item.start_time),
          displayEndTime: formatTimeTo12Hour(item.end_time),
          purpose: item.purpose || '',
          status: item.status,
          faculty: user.name
        }));
        
        setReservations(transformedReservations);
        console.log("Fetched reservations:", transformedReservations);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast({
        title: "Error loading reservations",
        description: "Could not load your reservation data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new reservation
  const createReservation = async (values: ReservationFormValues, roomId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to make a reservation.",
        variant: "destructive"
      });
      return null;
    }
    
    if (user.role !== 'faculty') {
      toast({
        title: "Access denied",
        description: "Only faculty members can make reservations.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      // Check for overlapping reservations
      const { data: existingReservations, error: checkError } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('room_id', roomId)
        .eq('date', values.date)
        .or(`start_time.lte.${values.endTime},end_time.gte.${values.startTime}`);
      
      if (checkError) throw checkError;
      
      if (existingReservations && existingReservations.length > 0) {
        toast({
          title: "Time slot unavailable",
          description: "The selected time slot overlaps with an existing reservation.",
          variant: "destructive"
        });
        return null;
      }
      
      // Create the reservation
      const { data, error } = await supabase
        .from('room_reservations')
        .insert({
          room_id: roomId,
          faculty_id: user.id,
          date: values.date,
          start_time: values.startTime,
          end_time: values.endTime,
          purpose: values.purpose,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Optimistically add the new reservation to the local state
      const newReservation: Reservation = {
        id: data.id,
        roomId: roomId,
        roomNumber: values.roomNumber,
        building: values.building,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        displayStartTime: values.startTime, // Will be formatted in fetchReservations
        displayEndTime: values.endTime, // Will be formatted in fetchReservations
        purpose: values.purpose,
        status: 'confirmed',
        faculty: user.name
      };
      
      setReservations(prev => [...prev, newReservation]);
      
      toast({
        title: "Room booked",
        description: `${values.roomNumber} has been booked successfully.`
      });
      
      // Refresh reservations to get the formatted times
      fetchReservations();
      
      return data;
    } catch (error) {
      console.error("Error booking room:", error);
      toast({
        title: "Booking failed",
        description: "Could not book the room. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Cancel a reservation
  const cancelReservation = async (reservationId: string) => {
    if (!user) return false;
    
    try {
      // Get the reservation to check if it belongs to the current user
      const { data: reservation, error: fetchError } = await supabase
        .from('room_reservations')
        .select('faculty_id')
        .eq('id', reservationId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Only allow faculty to cancel their own reservations or admins/superadmins to cancel any
      if (user.role === 'faculty' && reservation.faculty_id !== user.id) {
        toast({
          title: "Permission denied",
          description: "You can only cancel your own reservations.",
          variant: "destructive"
        });
        return false;
      }
      
      // Delete the reservation
      const { error } = await supabase
        .from('room_reservations')
        .delete()
        .eq('id', reservationId);
      
      if (error) throw error;
      
      // Update the local state
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      
      toast({
        title: "Reservation cancelled",
        description: "The room reservation has been cancelled."
      });
      
      return true;
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Cancellation failed",
        description: "Could not cancel the reservation. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Fetch reservations on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);
  
  // Set up real-time subscription to reservation changes
  useEffect(() => {
    if (!user) return;
    
    const reservationsChannel = supabase
      .channel('room_reservations_changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'room_reservations' }, 
          (payload) => {
            console.log('Reservation change detected:', payload);
            fetchReservations();
          })
      .subscribe();
    
    return () => {
      supabase.removeChannel(reservationsChannel);
    };
  }, [user]);

  return {
    reservations,
    loading,
    fetchReservations,
    createReservation,
    cancelReservation
  };
}
