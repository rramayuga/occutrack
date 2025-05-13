
import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"; 
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useReservationTimeTracker() {
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [completedReservations, setCompletedReservations] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all current and upcoming reservations
  const fetchActiveReservations = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
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
          faculty_id
        `)
        .eq('faculty_id', user.id)
        .eq('date', today)
        .neq('status', 'completed')
        .order('start_time');
      
      if (error) throw error;
      
      if (data) {
        // Transform data to Reservation type
        const reservationsWithDetails = await enrichReservationsWithDetails(data);
        setActiveReservations(reservationsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching active reservations:", error);
    }
  };

  // Add room and building details to reservations
  const enrichReservationsWithDetails = async (reservationData: any[]): Promise<Reservation[]> => {
    if (reservationData.length === 0) return [];
    
    try {
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
      
      // Create mappings for quick lookup
      const roomMap = Object.fromEntries(roomsData.map(room => [room.id, room]));
      const buildingMap = Object.fromEntries(buildingsData.map(building => [building.id, building.name]));
      
      // Transform the data
      return reservationData.map(item => {
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
          faculty: user?.name || ''
        };
      });
    } catch (error) {
      console.error("Error enriching reservations:", error);
      return [];
    }
  };

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
      
      // Remove the reservation from our active list
      setActiveReservations(prev => prev.filter(r => r.id !== reservationId));
      
      toast({
        title: "Reservation Completed",
        description: "Your reservation has ended and the room is now available.",
      });
    } catch (error) {
      console.error("Error marking reservation as completed:", error);
    }
  };

  // Set room status based on reservation time
  const updateRoomStatus = async (roomId: string, isOccupied: boolean) => {
    try {
      // Update room status in database
      const newStatus = isOccupied ? 'occupied' : 'available';
      
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);
      
      if (error) throw error;
      
      // Create availability record
      await supabase
        .from('room_availability')
        .insert({
          room_id: roomId,
          is_available: !isOccupied,
          status: newStatus,
          updated_by: user?.id || '',
          updated_at: new Date().toISOString()
        });
      
      if (isOccupied) {
        toast({
          title: "Room Now Occupied",
          description: "Your reserved room is now marked as occupied for your schedule.",
        });
      }
    } catch (error) {
      console.error("Error updating room status:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch of active reservations
    fetchActiveReservations();
    
    // Setup interval to check reservation times
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0];
      
      activeReservations.forEach(reservation => {
        // Skip if already in completed list
        if (completedReservations.includes(reservation.id)) return;
        
        // Check if reservation is for today
        if (reservation.date !== today) return;
        
        // Check if start time has been reached but room not yet occupied
        if (currentTime >= reservation.startTime && reservation.status !== 'occupied') {
          updateRoomStatus(reservation.roomId, true); // Mark as OCCUPIED at start time
        }
        
        // Check if end time has been reached and mark as completed
        if (currentTime >= reservation.endTime) {
          updateRoomStatus(reservation.roomId, false); // Mark as AVAILABLE at end time
          markReservationAsCompleted(reservation.id); // Remove from active list
        }
      });
    }, 60000); // Check every minute
    
    // Also set up a subscription to reservation changes
    const channel = supabase
      .channel('public:room_reservations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_reservations',
        filter: `faculty_id=eq.${user.id}`
      }, () => {
        fetchActiveReservations();
      })
      .subscribe();
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user, activeReservations, completedReservations]);

  return {
    activeReservations,
    completedReservations,
    fetchActiveReservations
  };
}
