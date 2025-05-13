
import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { ProfessorOverviewCards } from './professor/ProfessorOverviewCards';
import { RoomBookingDialog } from './professor/RoomBookingDialog';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { useReservationTimeTracker } from '@/hooks/useReservationTimeTracker';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { buildings, rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  
  // Initialize the reservation time tracker to handle automatic status updates
  const { activeReservations, fetchActiveReservations } = useReservationTimeTracker();
  
  // Fetch active reservations and refresh rooms on mount and periodically
  useEffect(() => {
    // Initial fetch
    fetchActiveReservations();
    refreshRooms();
    fetchReservations();
    
    // Set up interval for periodic refresh - more frequent updates for real-time status changes
    const intervalId = setInterval(() => {
      fetchReservations();
      refreshRooms();
    }, 10000); // Every 10 seconds for more real-time updates
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get today's schedule from reservations
  const todaySchedule = reservations.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate.getDate() === today.getDate() && 
           bookingDate.getMonth() === today.getMonth() && 
           bookingDate.getFullYear() === today.getFullYear() &&
           booking.status !== 'completed'; // Don't show completed reservations
  });

  // Handler for when a user clicks "Reserve" on an available room
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    setIsDialogOpen(true);
    // We'll need to pre-populate the form in the RoomBookingDialog component
    // This will be passed down to the component
  };
  
  // Filter out completed reservations from the display
  const activeReservationsForDisplay = reservations.filter(r => r.status !== 'completed');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <RoomBookingDialog 
          buildings={buildings}
          rooms={rooms}
          createReservation={createReservation}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

      {/* Overview Cards */}
      <ProfessorOverviewCards 
        todaySchedule={todaySchedule} 
        reservations={activeReservationsForDisplay} 
      />

      {/* Teaching Schedule & Room Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeachingSchedule reservations={reservations} />
        <AvailableRooms 
          rooms={rooms} 
          buildings={buildings} 
          onReserveClick={handleReserveClick} 
        />
      </div>
    </div>
  );
};
