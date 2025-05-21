
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { Reservation, ReservationFormValues } from '@/lib/types';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages

  // Fetch user's reservations
  const fetchReservations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all reservations for the current faculty
      const { data: reservationData, error: reservationError } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          purpose,
          status,
          faculty_id
        `)
        .eq('faculty_id', user.id)
        .neq('status', 'completed') // Don't get completed reservations by default
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (reservationError) throw reservationError;
      
      if (reservationData && reservationData.length > 0) {
        // Get room information for all reservations
        const roomIds = reservationData.map(item => item.room_id);
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name, building_id')
          .in('id', roomIds);
          
        if (roomsError) throw roomsError;
        
        // Get building information for all rooms
        const buildingIds = roomsData.map(room => room.building_id);
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds);
          
        if (buildingsError) throw buildingsError;
        
        // Create a mapping of room ids to room data
        const roomMap = roomsData.reduce((acc, room) => {
          acc[room.id] = room;
          return acc;
        }, {} as Record<string, any>);
        
        // Create a mapping of building ids to building names
        const buildingMap = buildingsData.reduce((acc, building) => {
          acc[building.id] = building.name;
          return acc;
        }, {} as Record<string, string>);
        
        // Transform the data
        const transformedReservations: Reservation[] = reservationData.map(item => {
          const room = roomMap[item.room_id] || { name: 'Unknown Room', building_id: null };
          const buildingName = room.building_id ? buildingMap[room.building_id] : 'Unknown Building';
          
          return {
            id: item.id,
            roomId: item.room_id,
            roomNumber: room.name,
            building: buildingName,
            date: item.date,
            startTime: item.start_time,
            endTime: item.end_time,
            purpose: item.purpose || '',
            status: item.status,
            faculty: user.name
          };
        });
        
        setReservations(transformedReservations);
        console.log("Fetched reservations:", transformedReservations);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      
      // Only show error toast if we haven't shown one recently
      const now = new Date();
      if (!lastError || now.getTime() - lastError.getTime() > ERROR_COOLDOWN_MS) {
        toast({
          title: "Error loading reservations",
          description: "Could not load your reservation data. Will retry automatically.",
          variant: "destructive"
        });
        setLastError(now);
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast, lastError]);

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
        description: "Only faculty members can make room reservations.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      // First, check if the room is under maintenance
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('status')
        .eq('id', roomId)
        .single();
        
      if (roomError) throw roomError;
      
      if (roomData?.status === 'maintenance') {
        toast({
          title: "Cannot Reserve Room",
          description: "This room is currently under maintenance and cannot be reserved.",
          variant: "destructive"
        });
        return null;
      }
      
      // Fixed time conflict check - proper overlap detection
      const { data: conflicts, error: conflictError } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('room_id', roomId)
        .eq('date', values.date)
        .neq('status', 'completed');
      
      if (conflictError) throw conflictError;

      // Manually check for time overlaps
      const hasTimeConflict = conflicts?.some(booking => {
        // Convert booking times to minutes for easier comparison
        const bookingStart = convertTimeToMinutes(booking.start_time);
        const bookingEnd = convertTimeToMinutes(booking.end_time);
        const newStart = convertTimeToMinutes(values.startTime);
        const newEnd = convertTimeToMinutes(values.endTime);
        
        // Check for overlap: new start time is before existing end time AND new end time is after existing start time
        return (newStart < bookingEnd && newEnd > bookingStart);
      });
      
      if (hasTimeConflict) {
        toast({
          title: "Time conflict",
          description: "This room is already booked during the selected time period.",
          variant: "destructive"
        });
        return null;
      }
      
      // Create the reservation
      const newReservation = {
        room_id: roomId,
        faculty_id: user.id,
        date: values.date,
        start_time: values.startTime,
        end_time: values.endTime,
        purpose: values.purpose,
        status: 'approved' // Auto-approve for now
      };
      
      const { data, error } = await supabase
        .from('room_reservations')
        .insert(newReservation)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast({
          title: "Room booked successfully",
          description: `You've booked ${values.roomNumber || 'a room'} in ${values.building || 'the building'} on ${values.date} from ${values.startTime} to ${values.endTime}`,
        });
        
        // Refresh reservations
        fetchReservations();
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Error",
        description: "Failed to book the room. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Helper function to convert time string (HH:MM) to minutes
  const convertTimeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Setup real-time subscription for reservation updates with better error handling
  const setupReservationsSubscription = useCallback(() => {
    if (!user) return () => {};
    
    try {
      const channel = supabase
        .channel('public:room_reservations')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations',
          filter: `faculty_id=eq.${user.id}`
        }, (payload) => {
          console.log('Reservation change received:', payload);
          fetchReservations();
        })
        .subscribe((status) => {
          console.log('Reservation subscription status:', status);
          
          // If subscription fails, retry after a delay
          if (status !== 'SUBSCRIBED') {
            setTimeout(() => {
              console.log('Retrying reservation subscription...');
              setupReservationsSubscription();
            }, 5000); // 5 second retry delay
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up reservation subscription:', error);
      // Return empty cleanup function in case of error
      return () => {};
    }
  }, [user?.id, fetchReservations]);

  useEffect(() => {
    if (user) {
      // Only fetch once on initial load
      fetchReservations();
      
      const unsubscribe = setupReservationsSubscription();
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id, fetchReservations, setupReservationsSubscription]);

  return {
    reservations,
    loading,
    createReservation,
    fetchReservations
  };
}
