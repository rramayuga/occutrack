
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
  const [isCreating, setIsCreating] = useState(false);
  const { simplifiedBuildings } = useBuildings();
  const { rooms, refreshRooms } = useRooms();
  const { reservations, createReservation, fetchReservations } = useReservations();
  const { toast } = useToast();
  
  // Use centralized reservation status manager with error handling
  const { 
    activeReservations, 
    fetchActiveReservations, 
    processReservations 
  } = useReservationStatusManager();
  
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
          description: "Unable to connect to the server. Please try again later.",
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
          isCreating={isCreating}
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
                
                // Manually refresh data with reduced delays
                setTimeout(() => {
                  console.log("Refreshing data after room reservation");
                  refreshRooms().catch(console.error);
                  fetchReservations().catch(console.error);
                  fetchActiveReservations().catch(console.error);
                  
                  // Process reservations to update room status
                  setTimeout(() => {
                    console.log("Processing reservations after room reservation");
                    processReservations().catch(console.error);
                  }, 500);
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
        />
      </div>
    </div>
  );
};
