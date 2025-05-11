
import React, { useState } from 'react';
import { User, Building } from '@/lib/types';
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
  // Extract buildings and rooms from useRooms
  const { buildings, rooms } = useRooms();
  const { reservations, createReservation } = useReservations();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  // Convert BuildingWithFloors[] to Building[] if needed
  const simplifiedBuildings: Building[] = buildings.map(building => ({
    id: building.id,
    name: building.name,
    location: building.location,
    floors: building.floors.length // Convert floors array to number
  }));
  
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
          <AvailableRooms rooms={rooms} buildings={simplifiedBuildings} />
        </div>
      </div>

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Classroom</DialogTitle>
          </DialogHeader>
          <BookRoomForm 
            buildings={simplifiedBuildings} 
            onSubmit={async (values) => {
              if (values.roomId) {
                await createReservation({
                  ...values,
                  date: values.date instanceof Date ? values.date.toISOString() : values.date || ''
                }, values.roomId);
                setIsBookingDialogOpen(false);
              }
            }}
            onCancel={() => setIsBookingDialogOpen(false)}
            excludeMaintenanceRooms={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
