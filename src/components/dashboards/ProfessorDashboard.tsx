
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
import { useToast } from "@/hooks/use-toast";

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { simplifiedBuildings } = useBuildings();
  const { rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  const { toast } = useToast();
  
  // Use centralized reservation status manager
  const { activeReservations, fetchActiveReservations, processReservations } = useReservationStatusManager();
  
  // Initial data fetch on mount
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    refreshRooms();
    fetchReservations();
    fetchActiveReservations();
    
    // Process reservations immediately to update room statuses
    setTimeout(() => processReservations(), 1000);
  }, [refreshRooms, fetchReservations, fetchActiveReservations, processReservations]);
  
  // Set up auto-refresh to keep the data current
  useEffect(() => {
    // Refresh data more frequently to stay current
    const intervalId = setInterval(() => {
      console.log("ProfessorDashboard - Auto refresh");
      refreshRooms();
      fetchReservations();
      fetchActiveReservations();
    }, 10000); // Every 10 seconds for better real-time experience
    
    return () => clearInterval(intervalId);
  }, [refreshRooms, fetchReservations, fetchActiveReservations]);
  
  // Add a more frequent processor for room status updates based on time
  useEffect(() => {
    console.log("Setting up reservation processor in ProfessorDashboard");
    
    // Process reservations more frequently
    const statusInterval = setInterval(() => {
      console.log("ProfessorDashboard - Processing reservations for status updates");
      processReservations();
    }, 5000); // Every 5 seconds
    
    // Run once on mount too
    processReservations();
    
    return () => clearInterval(statusInterval);
  }, [processReservations]);
  
  // Memoize today's schedule
  const todaySchedule = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const currentTime = today.toTimeString().substring(0, 5);
    
    return reservations.filter(booking => {
      if (booking.status === 'completed') return false;
      if (booking.date > todayString) return true;
      if (booking.date === todayString) {
        const [endHour, endMinute] = booking.endTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMinute;
        const currentMinutes = currentHour * 60 + currentMinute;
        return endMinutes > currentMinutes;
      }
      return false;
    });
  }, [reservations]);

  // Handler for room reservation with proper parameters
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    setIsDialogOpen(true);
  };
  
  // Filter out completed reservations for display
  const activeReservationsForDisplay = useMemo(() => 
    reservations.filter(r => {
      if (r.status === 'completed') return false;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().substring(0, 5);
      
      if (r.date < today) return false;
      
      if (r.date === today) {
        const [endHour, endMinute] = r.endTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMinute;
        const currentMinutes = currentHour * 60 + currentMinute;
        
        if (endMinutes <= currentMinutes) {
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
          createReservation={async (data) => {
            try {
              await createReservation(data, data.roomId);  // Fix: Passing both required arguments
              toast({
                title: "Room Reserved",
                description: "Your room has been reserved successfully",
                duration: 3000,
              });
              // Manually refresh data after reservation
              setTimeout(() => {
                refreshRooms();
                fetchReservations();
                fetchActiveReservations();
                processReservations();
              }, 1000);
            } catch (error) {
              console.error("Error creating reservation:", error);
              toast({
                title: "Error",
                description: "Failed to reserve room. Please try again.",
                duration: 3000,
              });
            }
          }}
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
