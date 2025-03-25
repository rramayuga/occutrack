
import { useState, useEffect } from 'react';
import { Room, Reservation, RoomStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useRoomCardLogic = (room: Room, onToggleAvailability: (roomId: string) => void) => {
  const [occupiedBy, setOccupiedBy] = useState<string | null>(null);
  const [roomSchedules, setRoomSchedules] = useState<Reservation[]>([]);
  const [showSchedules, setShowSchedules] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get effective status from the room object
  const getEffectiveStatus = (): RoomStatus => {
    if (room.status) return room.status;
    return room.isAvailable ? 'available' : 'occupied';
  };

  // Set room status in the database
  const handleStatusChange = async (status: RoomStatus) => {
    if (!user) return;
    
    try {
      // First update the room availability record
      const isAvailable = status === 'available';
      
      const { error: availabilityError } = await supabase
        .from('room_availability')
        .insert({
          room_id: room.id,
          is_available: isAvailable,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      if (availabilityError) throw availabilityError;
      
      // Then update the room status in the rooms table
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: status })
        .eq('id', room.id);
      
      if (roomError) throw roomError;
      
      toast({
        title: "Room status updated",
        description: `Room status changed to ${status}`,
      });
      
      // Update local state - will be overridden on next data fetch anyway
      onToggleAvailability(room.id);
    } catch (error) {
      console.error("Error updating room status:", error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!room.isAvailable || room.status === 'occupied') {
      fetchRoomOccupant();
    }
    fetchRoomSchedules();
  }, [room.id, room.isAvailable, room.status]);

  const fetchRoomOccupant = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          faculty_id,
          profiles:faculty_id (name)
        `)
        .eq('room_id', room.id)
        .eq('date', today)
        .lt('start_time', currentTime)
        .gt('end_time', currentTime)
        .limit(1);
      
      if (error) {
        console.error("Error fetching room occupant:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setOccupiedBy(data[0].profiles?.name || "Unknown Faculty");
      } else {
        setOccupiedBy(room.occupiedBy || null);
      }
    } catch (error) {
      console.error("Error in fetchRoomOccupant:", error);
    }
  };

  const fetchRoomSchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          date,
          start_time,
          end_time,
          purpose,
          status,
          faculty_id,
          profiles:faculty_id (name)
        `)
        .eq('room_id', room.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error("Error fetching room schedules:", error);
        return;
      }
      
      if (data) {
        const reservations: Reservation[] = data.map(item => ({
          id: item.id,
          roomId: room.id,
          roomNumber: room.name,
          building: '', // Not needed for display
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          purpose: item.purpose || '',
          status: item.status,
          faculty: item.profiles?.name || "Unknown Faculty"
        }));
        
        setRoomSchedules(reservations);
        
        if (user && user.role === 'faculty') {
          setRemindersForFacultyReservations(reservations.filter(r => r.faculty === user.name));
        }
      }
    } catch (error) {
      console.error("Error in fetchRoomSchedules:", error);
    }
  };
  
  const setRemindersForFacultyReservations = (facultyReservations: Reservation[]) => {
    facultyReservations.forEach(reservation => {
      const reservationDate = new Date(reservation.date);
      const [startHour, startMinute] = reservation.startTime.split(':').map(Number);
      
      reservationDate.setHours(startHour, startMinute, 0, 0);
      
      // Set reminder for 30 minutes before
      const reminderTime = new Date(reservationDate.getTime() - 30 * 60 * 1000);
      const now = new Date();
      
      // Only set reminder if it's in the future
      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
          toast({
            title: "Upcoming Reservation Reminder",
            description: `You have a reservation in 30 minutes for room ${room.name} at ${reservation.startTime}`,
            duration: 10000,
          });
        }, timeUntilReminder);
      }
    });
  };
  
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
      
      fetchRoomSchedules();
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
  
  const handleToggleSchedules = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSchedules(!showSchedules);
  };
  
  const handleCancelClick = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setIsCancelDialogOpen(true);
  };
  
  // Check if the current user is the faculty for a reservation
  const isUserFaculty = (reservation: Reservation) => {
    return user && user.role === 'faculty' && reservation.faculty === user.name;
  };

  return {
    occupiedBy,
    roomSchedules,
    showSchedules,
    isCancelDialogOpen,
    selectedReservation,
    getEffectiveStatus,
    handleStatusChange,
    handleCancelReservation,
    handleToggleSchedules,
    handleCancelClick,
    isUserFaculty,
    setIsCancelDialogOpen
  };
};
