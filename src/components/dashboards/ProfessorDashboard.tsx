
import React, { useState } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import BookRoomDialog from '@/components/rooms/BookRoomDialog';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const { buildings, rooms, refetchRooms } = useRooms();
  const { reservations, fetchReservations } = useReservations();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  // Get available rooms (not under maintenance)
  const availableRooms = rooms.filter(room => room.status !== 'maintenance');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        
        <Button 
          onClick={() => setIsBookingDialogOpen(true)} 
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Book a Classroom
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <TeachingSchedule reservations={reservations} />
        </div>
        <div className="col-span-1">
          <AvailableRooms rooms={availableRooms} buildings={buildings} />
        </div>
      </div>
      
      {/* Booking Dialog */}
      <BookRoomDialog 
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        onBookingComplete={() => {
          fetchReservations();
          refetchRooms();
        }}
      />
    </div>
  );
};
