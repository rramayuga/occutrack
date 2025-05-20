
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkNetworkConnectivity } from '@/integrations/supabase/client';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkConnected, setNetworkConnected] = useState(true);
  const { simplifiedBuildings } = useBuildings();
  const { rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  const { toast } = useToast();
  
  // Use centralized reservation status manager with error handling
  const { 
    activeReservations, 
    fetchActiveReservations, 
    processReservations,
    connectionError: reservationConnectionError
  } = useReservationStatusManager();
  
  // Check network connectivity on a regular interval
  useEffect(() => {
    const checkConnectivity = async () => {
      const isConnected = await checkNetworkConnectivity();
      setNetworkConnected(isConnected);
    };
    
    // Initial check
    checkConnectivity();
    
    // Set interval for regular checks
    const intervalId = setInterval(checkConnectivity, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to retry connections and refresh data
  const retryConnection = useCallback(async () => {
    setIsConnecting(true);
    try {
      toast({
        title: "Reconnecting...",
        description: "Attempting to reconnect to the server",
      });
      
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      
      if (!isConnected) {
        throw new Error("Network connection unavailable");
      }
      
      // Try to refresh all data sources with longer timeouts
      await Promise.allSettled([
        refreshRooms(),
        fetchReservations(),
        fetchActiveReservations()
      ]);
      
      // Process reservations after fetching data
      await processReservations();
      
      toast({
        title: "Reconnected",
        description: "Successfully reconnected to the server",
      });
      
      setNetworkConnected(true);
    } catch (error) {
      console.error("Reconnection failed:", error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to the server. Please check your network connection and try again.",
        variant: "destructive",
      });
      
      setNetworkConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshRooms, fetchReservations, fetchActiveReservations, processReservations, toast]);
  
  // Initial data fetch on mount - once only
  useEffect(() => {
    console.log("ProfessorDashboard - Initial data fetch");
    const fetchData = async () => {
      try {
        await refreshRooms();
        await fetchReservations();
        await fetchActiveReservations();
        await processReservations();
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: "Connection Issue",
          description: "Unable to connect to the server. Please try refreshing.",
          variant: "destructive",
          duration: 5000
        });
      }
    };
    
    fetchData();
    
    // Reprocess after a short delay to catch any updates
    const timeoutId = setTimeout(() => {
      console.log("ProfessorDashboard - Processing reservations after delay");
      processReservations().catch(error => {
        console.error("Error processing reservations:", error);
      });
      refreshRooms().catch(error => {
        console.error("Error refreshing rooms:", error);
      });
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []); 
  
  // Handler for room reservation with proper parameters
  const handleReserveClick = (buildingId: string, roomId: string, buildingName: string, roomName: string) => {
    // Check network connectivity first
    if (!networkConnected || reservationConnectionError) {
      toast({
        title: "Connection Error",
        description: "Cannot reserve rooms while offline. Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }
    
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
  
  const connectionError = !networkConnected || reservationConnectionError;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {connectionError && (
        <Alert variant="destructive" className="mb-6">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <AlertTitle>Connection Error</AlertTitle>
          </div>
          <AlertDescription className="flex items-center justify-between">
            <span>Unable to connect to the reservation system. Some features may not work correctly.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryConnection} 
              disabled={isConnecting}
              className="ml-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>
          </AlertDescription>
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
          isCreating={isCreating}
          connectionError={connectionError}
          createReservation={async (data, roomId) => {
            try {
              setIsCreating(true);
              console.log("Creating reservation with roomId:", roomId);
              const result = await createReservation(data, roomId);
              
              if (result) {
                toast({
                  title: "Room Reserved",
                  description: "Your room has been reserved successfully",
                  duration: 3000,
                });
                
                // Aggressively refresh data to ensure UI reflects the new reservation
                setTimeout(async () => {
                  console.log("Refreshing data after room reservation");
                  try {
                    await Promise.all([
                      refreshRooms(),
                      fetchReservations(), 
                      fetchActiveReservations()
                    ]);
                    
                    // Process reservations to update room status
                    setTimeout(() => {
                      console.log("Processing reservations after room reservation");
                      processReservations().catch(console.error);
                    }, 500);
                  } catch (error) {
                    console.error("Error refreshing data after reservation:", error);
                  }
                }, 500);
                
                return result;
              }
              return null;
            } catch (error) {
              console.error("Error creating reservation:", error);
              toast({
                title: "Error",
                description: "Failed to reserve room. Please try again.",
                variant: "destructive",
                duration: 3000,
              });
              return null;
            } finally {
              setIsCreating(false);
            }
          }}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

      {/* Overview Cards */}
      <ProfessorOverviewCards 
        todaySchedule={activeReservationsForDisplay} 
        reservations={activeReservationsForDisplay} 
      />

      {/* Teaching Schedule & Room Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeachingSchedule reservations={activeReservationsForDisplay} />
        <AvailableRooms 
          rooms={rooms} 
          buildings={simplifiedBuildings} 
          onReserveClick={handleReserveClick}
          connectionError={connectionError} 
        />
      </div>
    </div>
  );
};
