
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { ProfessorOverviewCards } from './professor/ProfessorOverviewCards';
import { RoomBookingDialog } from './professor/RoomBookingDialog';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { useReservationStatusManager } from '@/hooks/useReservationStatusManager';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { buildings, rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  
  // Use our centralized reservation status manager
  const { activeReservations } = useReservationStatusManager();
  
  // Initial data fetch on mount - only once
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    refreshRooms();
    fetchReservations();
  }, [refreshRooms, fetchReservations]);
  
  // Memoize today's schedule to prevent unnecessary re-renders
  const todaySchedule = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return reservations.filter(booking => {
      return booking.date === todayString && booking.status !== 'completed';
    });
  }, [reservations]);

  // Handler for when a user clicks "Reserve" on an available room
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    setIsDialogOpen(true);
    // Pre-populate form handled by RoomBookingDialog component
  };
  
  // Filter out completed reservations for display - memoized to prevent re-renders
  const activeReservationsForDisplay = useMemo(() => 
    reservations.filter(r => r.status !== 'completed'),
    [reservations]
  );
  
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
