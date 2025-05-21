
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const { simplifiedBuildings } = useBuildings();
  const { rooms, refreshRooms, connectionError } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use centralized reservation status manager
  const { activeReservations, fetchActiveReservations, processReservations, hasConnectionError } = useReservationStatusManager();
  
  // Track last refresh time to limit frequency
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  
  // Combine connection errors from different sources
  const showConnectionError = connectionError || hasConnectionError;
  
  // Initial data fetch on mount - once only
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    refreshRooms();
    fetchReservations();
    fetchActiveReservations();
    
    // Process reservations only once initially with a delay
    const timeoutId = setTimeout(() => processReservations(), 4000);
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty deps array - run only on mount
  
  // Set up auto-refresh to keep the data current - with greatly reduced frequency
  useEffect(() => {
    // Refresh data much less frequently 
    const intervalId = setInterval(() => {
      // Only refresh if it's been at least 10 minutes since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime > 600000) { // 10 minutes minimum between refreshes (increased from 5 minutes)
        console.log("ProfessorDashboard - Scheduled refresh");
        refreshRooms();
        fetchReservations();
        fetchActiveReservations();
        setLastRefreshTime(now);
      }
    }, 600000); // Every 10 minutes (increased from 5 minutes)
    
    return () => clearInterval(intervalId);
  }, [refreshRooms, fetchReservations, fetchActiveReservations, lastRefreshTime]);
  
  // Handle retry connection click
  const handleRetryConnection = () => {
    setIsRetrying(true);
    
    // Attempt to refresh all data
    Promise.all([
      refreshRooms(),
      fetchReservations(),
      fetchActiveReservations(),
      processReservations()
    ]).finally(() => {
      setIsRetrying(false);
      setLastRefreshTime(Date.now());
      
      // Show toast if connection is restored
      if (!connectionError && !hasConnectionError) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the reservation system.",
          duration: 3000
        });
      }
    });
  };
  
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
      {showConnectionError && (
        <Alert variant="destructive" className="mb-6 flex items-center justify-between bg-red-50 border border-red-200">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-red-500 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <AlertDescription>
              Unable to connect to the reservation system. Some features may not work correctly.
            </AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
          >
            {isRetrying ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry Connection
              </>
            )}
          </Button>
        </Alert>
      )}
    
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
                duration: 3000, // Ensure toast auto-dismisses after 3 seconds
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
                duration: 3000, // Ensure error toast also auto-dismisses
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
        <TeachingSchedule 
          reservations={reservations} 
          onReservationChange={() => {
            fetchReservations();
            refreshRooms();
          }}
        />
        <AvailableRooms 
          rooms={rooms} 
          buildings={simplifiedBuildings} 
          onReserveClick={handleReserveClick} 
        />
      </div>
    </div>
  );
};
