import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { ProfessorOverviewCards } from './professor/ProfessorOverviewCards';
import { RoomBookingDialog } from './professor/RoomBookingDialog';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { useReservationStatusManager } from '@/hooks/useReservationStatusManager';
import { useBuildings } from '@/hooks/useBuildings';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { simplifiedBuildings } = useBuildings(); // Use the simplified buildings
  const { rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  
  // Use our centralized reservation status manager
  const { activeReservations, fetchActiveReservations, processReservations } = useReservationStatusManager();
  
  // Initial data fetch on mount - only once
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    refreshRooms();
    fetchReservations();
    fetchActiveReservations();
  }, [refreshRooms, fetchReservations, fetchActiveReservations]);
  
  // Set up auto-refresh to keep the data current
  useEffect(() => {
    // Refresh data more frequently to stay current
    const intervalId = setInterval(() => {
      console.log("ProfessorDashboard - Auto refresh");
      refreshRooms();
      fetchReservations();
      fetchActiveReservations();
    }, 30000); // Every 30 seconds (reduced from 60 seconds)
    
    return () => clearInterval(intervalId);
  }, [refreshRooms, fetchReservations, fetchActiveReservations]);
  
  // Add a more frequent processor for room status updates based on time
  useEffect(() => {
    console.log("Setting up reservation processor in ProfessorDashboard");
    
    // Process reservations more frequently for better responsiveness
    const statusInterval = setInterval(() => {
      console.log("ProfessorDashboard - Processing reservations for status updates");
      processReservations();
    }, 15000); // Every 15 seconds (reduced from 20 seconds)
    
    // Run once on mount too
    processReservations();
    
    return () => clearInterval(statusInterval);
  }, [processReservations]);
  
  // Memoize today's schedule to prevent unnecessary re-renders, with improved filtering
  const todaySchedule = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = today.toTimeString().substring(0, 5); // HH:MM format
    
    // Filter out completed reservations and past reservations on the same day
    return reservations.filter(booking => {
      // Skip completed bookings
      if (booking.status === 'completed') return false;
      
      // If it's for a future date, include it
      if (booking.date > todayString) return true;
      
      // If it's for today, only include if it hasn't ended yet
      if (booking.date === todayString) {
        const [endHour, endMinute] = booking.endTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        
        // Compare end time with current time
        if (endHour > currentHour || (endHour === currentHour && endMinute > currentMinute)) {
          return true;
        }
        return false;
      }
      
      // Past dates are filtered out
      return false;
    });
  }, [reservations]);

  // Handler for when a user clicks "Reserve" on an available room
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    setIsDialogOpen(true);
    // Pre-populate form handled by RoomBookingDialog component
  };
  
  // Filter out completed reservations for display - memoized to prevent re-renders
  const activeReservationsForDisplay = useMemo(() => 
    reservations.filter(r => {
      // Filter out completed reservations
      if (r.status === 'completed') return false;
      
      // Also filter out past reservations
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);
      
      // If reservation is for a past date, filter it out
      if (r.date < today) return false;
      
      // If reservation is for today but has ended, filter it out
      if (r.date === today) {
        const [endHour, endMinute] = r.endTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        
        if (endHour < currentHour || (endHour === currentHour && endMinute <= currentMinute)) {
          return false;
        }
      }
      
      return true;
    }),
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
          buildings={simplifiedBuildings}
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
          buildings={simplifiedBuildings} 
          onReserveClick={handleReserveClick} 
        />
      </div>
    </div>
  );
};
