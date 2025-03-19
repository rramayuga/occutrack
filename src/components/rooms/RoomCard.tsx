
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, Calendar } from 'lucide-react';
import { Room, Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { useToast } from "@/components/ui/use-toast";
import RoomStatusBadge from './RoomStatusBadge';
import RoomOccupantInfo from './RoomOccupantInfo';
import RoomScheduleList from './RoomScheduleList';
import CancelReservationDialog from './CancelReservationDialog';

export interface RoomCardProps {
  room: Room;
  canModifyRooms: boolean;
  onToggleAvailability: (roomId: string) => void;
  onSelectRoom?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  canModifyRooms, 
  onToggleAvailability,
  onSelectRoom
}) => {
  const [occupiedBy, setOccupiedBy] = useState<string | null>(null);
  const [roomSchedules, setRoomSchedules] = useState<Reservation[]>([]);
  const [showSchedules, setShowSchedules] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!room.isAvailable) {
      fetchRoomOccupant();
    }
    fetchRoomSchedules();
  }, [room.id, room.isAvailable]);

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
        setOccupiedBy(null);
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

  const handleCardClick = () => {
    if (onSelectRoom) {
      onSelectRoom();
    }
  };

  const handleToggleAvailability = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAvailability(room.id);
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

  return (
    <>
      <Card 
        className={`hover:shadow-md transition-shadow ${onSelectRoom ? 'cursor-pointer' : ''} ${room.isAvailable ? '' : 'border-red-200'}`}
        onClick={onSelectRoom ? handleCardClick : undefined}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{room.name}</CardTitle>
            <RoomStatusBadge isAvailable={room.isAvailable} />
          </div>
          <RoomOccupantInfo isAvailable={room.isAvailable} occupiedBy={occupiedBy} />
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>{room.type}</div>
            <div>Capacity: {room.capacity || 30}</div>
          </div>
        </CardContent>
        <CardFooter className="pt-1 flex flex-col">
          {canModifyRooms ? (
            <Button 
              variant={room.isAvailable ? "outline" : "default"}
              size="sm"
              className="w-full mb-2"
              onClick={handleToggleAvailability}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {room.isAvailable ? 'Mark as Occupied' : 'Mark as Available'}
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center mb-2 w-full justify-center">
              <Lock className="h-3 w-3 mr-1" />
              {!room.isAvailable ? 'Currently in use' : 'Ready for use'}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={handleToggleSchedules}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {showSchedules ? 'Hide Schedule' : 'View Schedule'}
          </Button>
        </CardFooter>
        
        <RoomScheduleList 
          roomSchedules={roomSchedules}
          showSchedules={showSchedules}
          isUserFaculty={isUserFaculty}
          onCancelClick={handleCancelClick}
        />
      </Card>
      
      <CancelReservationDialog
        open={isCancelDialogOpen}
        setOpen={setIsCancelDialogOpen}
        reservation={selectedReservation}
        roomName={room.name}
        onConfirmCancel={handleCancelReservation}
      />
    </>
  );
};

export default RoomCard;
