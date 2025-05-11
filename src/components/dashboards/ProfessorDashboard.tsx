
import React, { useState } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BookRoomForm from '@/components/rooms/BookRoomForm';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const { buildings, rooms } = useRooms();
  const { reservations, createReservation } = useReservations();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <Button onClick={() => setIsBookingDialogOpen(true)}>
          Book a Classroom
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <TeachingSchedule reservations={reservations} />
        </div>
        <div className="col-span-1">
          <AvailableRooms rooms={rooms} buildings={buildings} />
        </div>
      </div>

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Classroom</DialogTitle>
          </DialogHeader>
          <BookRoomForm 
            buildings={buildings} 
            onSubmit={async (values) => {
              await createReservation(values, values.roomId);
              setIsBookingDialogOpen(false);
            }}
            onCancel={() => setIsBookingDialogOpen(false)}
            excludeMaintenanceRooms={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
