
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
        
        // Transform the data
        const transformedReservations: Reservation[] = data.map(item => ({
          id: item.id,
          roomId: item.room_id,
          roomNumber: item.rooms.name,
          building: buildingNames[item.rooms.building_id] || 'Unknown Building',
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
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
      
      // Check for time conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('room_id', roomId)
        .eq('date', values.date)
        .or(`start_time.lte.${values.endTime},end_time.gte.${values.startTime}`);
      
      if (conflictError) throw conflictError;
      
      if (conflicts && conflicts.length > 0) {
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

  // Setup real-time subscription for reservation updates
  const setupReservationsSubscription = () => {
    if (!user) return () => {};
    
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (user) {
      fetchReservations();
      
      const unsubscribe = setupReservationsSubscription();
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  return {
    reservations,
    loading,
    createReservation,
    fetchReservations
  };
}
