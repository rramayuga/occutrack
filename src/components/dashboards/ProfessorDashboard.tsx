
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { ProfessorOverviewCards } from './professor/ProfessorOverviewCards';
import { RoomBookingDialog } from './professor/RoomBookingDialog';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { useReservationStatusManager } from '@/hooks/reservation/useReservationStatusManager';
import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from "@/hooks/use-toast";

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const { simplifiedBuildings } = useBuildings();
  const { rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  const { toast } = useToast();
  
  // Use centralized reservation status manager
  const { activeReservations, fetchActiveReservations, processReservations } = useReservationStatusManager();
  
  // Track last refresh time to limit frequency
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  
  // Initial data fetch on mount - once only
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    refreshRooms();
    fetchReservations();
    fetchActiveReservations();
    
    // Process reservations only once initially with a delay
    const timeoutId = setTimeout(() => processReservations(), 2000);
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty deps array - run only on mount
  
  // Set up auto-refresh to keep the data current - with greatly reduced frequency
  useEffect(() => {
    // Refresh data much less frequently 
    const intervalId = setInterval(() => {
      // Only refresh if it's been at least 5 minutes since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime > 300000) { // 5 minutes minimum between refreshes
        console.log("ProfessorDashboard - Scheduled refresh");
        refreshRooms();
        fetchReservations();
        fetchActiveReservations();
        setLastRefreshTime(now);
      }
    }, 300000); // Every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [refreshRooms, fetchReservations, fetchActiveReservations, lastRefreshTime]);
  
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
    setSelectedRoomId(roomId); // Store the selected room ID
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
              // Use the stored selectedRoomId instead of accessing data.roomId
              await createReservation(data, selectedRoomId);
              toast({
                title: "Room Reserved",
                description: "Your room has been reserved successfully",
                duration: 3000,
              });
              // Manually refresh data after reservation with delay
              setTimeout(() => {
                refreshRooms();
                fetchReservations();
                fetchActiveReservations();
                // Process after everything has updated
                setTimeout(() => processReservations(), 2000);
              }, 2000);
            } catch (error) {
              console.error("Error creating reservation:", error);
              toast({
                title: "Error",
                description: "Failed to reserve room. Please try again.",
                variant: "destructive",
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
