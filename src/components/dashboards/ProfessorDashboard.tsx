
import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { ProfessorOverviewCards } from './professor/ProfessorOverviewCards';
import { RoomBookingDialog } from './professor/RoomBookingDialog';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { useToast } from "@/components/ui/use-toast";

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { buildings, rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, refreshReservations } = useReservations();
  const { toast } = useToast();
  
  // Ensure we have fresh data when the dashboard loads
  useEffect(() => {
    console.log("Professor dashboard mounted, refreshing data...");
    const loadData = async () => {
      try {
        await Promise.all([refreshRooms(), refreshReservations()]);
        console.log("Professor dashboard data refreshed");
      } catch (error) {
        console.error("Error refreshing professor dashboard data:", error);
        toast({
          title: "Error loading data",
          description: "Please refresh the page to try again",
          variant: "destructive"
        });
      }
    };
    
    loadData();
  }, [refreshRooms, refreshReservations, toast]);
  
  // Get today's schedule from reservations
  const todaySchedule = reservations.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate.getDate() === today.getDate() && 
           bookingDate.getMonth() === today.getMonth() && 
           bookingDate.getFullYear() === today.getFullYear();
  });

  // Handler for when a user clicks "Reserve" on an available room
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    setIsDialogOpen(true);
    // We'll need to pre-populate the form in the RoomBookingDialog component
    // This will be passed down to the component
  };
  
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
        reservations={reservations} 
      />

      {/* Teaching Schedule & Room Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeachingSchedule 
          reservations={reservations}
          onReservationCanceled={refreshReservations} 
        />
        <AvailableRooms 
          rooms={rooms} 
          buildings={buildings} 
          onReserveClick={handleReserveClick} 
        />
      </div>
    </div>
  );
};
