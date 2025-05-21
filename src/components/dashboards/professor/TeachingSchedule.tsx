
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, X } from 'lucide-react';
import { Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TeachingScheduleProps {
  reservations: Reservation[];
  onReservationChange?: () => void;
}

export const TeachingSchedule: React.FC<TeachingScheduleProps> = ({ 
  reservations,
  onReservationChange = () => {}
}) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Add cooldown for error toasts to prevent spam
  const ERROR_COOLDOWN_MS = 10000; // 10 seconds between error messages
  
  // Compare times in HH:MM format
  const compareTimeStrings = (time1: string, time2: string): number => {
    // Parse times to ensure proper comparison
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    if (hours1 !== hours2) {
      return hours1 - hours2;
    }
    return minutes1 - minutes2;
  };
  
  // Use memoization to filter out completed reservations and apply time-based filtering
  const filteredReservations = useMemo(() => {
    // Filter out completed reservations
    const active = reservations.filter(res => res.status !== 'completed');
    
    // Additional filter for past reservations on the same day
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    return active.filter(res => {
      // Always include future dates
      if (res.date > today) return true;
      
      // For today's reservations, only include current and upcoming
      if (res.date === today) {
        // Has the reservation's end time passed?
        return compareTimeStrings(currentTime, res.endTime) < 0;
      }
      
      // Filter out past dates
      return false;
    });
  }, [reservations]);

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsCancelDialogOpen(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('room_reservations')
        .delete()
        .eq('id', selectedReservation.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reservation Cancelled",
        description: "Your room reservation has been cancelled successfully.",
      });
      
      // Notify parent of the change
      onReservationChange();
      
      // Close dialog
      setIsCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      
      // Only show error toast if we haven't shown one recently
      const now = new Date();
      if (!lastError || now.getTime() - lastError.getTime() > ERROR_COOLDOWN_MS) {
        toast({
          title: "Error",
          description: "Failed to cancel reservation. Please try again.",
          variant: "destructive"
        });
        setLastError(now);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Setup realtime subscription to reservation changes with improved error handling
  useEffect(() => {
    try {
      const channel = supabase
        .channel('teaching-schedule-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations'
        }, (payload) => {
          console.log("Reservation change detected in TeachingSchedule:", payload);
          // Notify parent component to update
          onReservationChange();
        })
        .subscribe((status) => {
          console.log("TeachingSchedule subscription status:", status);
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error setting up teaching schedule subscription:", error);
    }
  }, [onReservationChange]);

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Teaching Schedule</CardTitle>
          <CardDescription>Your booked classes and locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((booking) => {
                // Determine if the booking is currently active
                const now = new Date();
                const bookingDate = new Date(booking.date);
                const today = new Date();
                const isToday = bookingDate.getDate() === today.getDate() && 
                              bookingDate.getMonth() === today.getMonth() && 
                              bookingDate.getFullYear() === today.getFullYear();
                
                const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
                
                // FIX: Using proper time comparison instead of date manipulation
                const isActive = isToday && 
                               compareTimeStrings(currentTime, booking.startTime) >= 0 && 
                               compareTimeStrings(currentTime, booking.endTime) < 0;
                
                return (
                  <div key={booking.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={`rounded-full p-2 ${isActive ? 'bg-red-100' : 'bg-primary/10'}`}>
                      <CheckCircle className={`h-4 w-4 ${isActive ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{booking.purpose}</h4>
                      <p className="text-xs text-muted-foreground">{booking.building} - {booking.roomNumber}</p>
                    </div>
                    <div className="ml-auto text-right flex items-center gap-2">
                      <div>
                        <span className="text-xs font-medium">
                          {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                        </span>
                        <div className="text-xs mt-1">
                          <span className={`${isActive ? 'text-red-500' : (isToday ? 'text-orange-500' : 'text-green-500')}`}>
                            {isActive ? 'In Progress' : (isToday ? 'Today' : 'Scheduled')}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleCancelClick(booking)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No classes scheduled yet. Book a room to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your reservation in {selectedReservation?.building} - {selectedReservation?.roomNumber} on {selectedReservation?.date} from {selectedReservation?.startTime} to {selectedReservation?.endTime}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No, Keep It</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelReservation} 
              className="bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
