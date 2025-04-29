import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useRoomSchedules = (roomId: string, roomName: string) => {
  const [roomSchedules, setRoomSchedules] = useState<Reservation[]>([]);
  const [showSchedules, setShowSchedules] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
        .eq('room_id', roomId)
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
          roomId: roomId,
          roomNumber: roomName,
          building: '',
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
      
      const reminderTime = new Date(reservationDate.getTime() - 30 * 60 * 1000);
      const now = new Date();
      
      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
          toast({
            title: "Upcoming Reservation Reminder",
            description: `You have a reservation in 30 minutes for room ${roomName} at ${reservation.startTime}`,
            duration: 10000,
          });
        }, timeUntilReminder);
      }
    });
  };

  useEffect(() => {
    fetchRoomSchedules();
  }, [roomId]);

  const handleToggleSchedules = () => {
    setShowSchedules(!showSchedules);
  };

  return {
    roomSchedules,
    showSchedules,
    handleToggleSchedules
  };
};
