
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, X } from 'lucide-react';
import { Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TeachingScheduleProps {
  reservations: Reservation[];
}

export const TeachingSchedule: React.FC<TeachingScheduleProps> = ({ reservations }) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { toast } = useToast();
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(reservations);
  const filterTimerRef = useRef<number | null>(null);

  // Filter out completed reservations - memoized to avoid unnecessary recalculations
  const filterActiveReservations = useCallback(() => {
    const now = new Date();
    const active = reservations.filter(booking => {
      const bookingDate = new Date(booking.date);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      
      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      return endDateTime > now;
    });
    
    setFilteredReservations(active);
  }, [reservations]);

  // Debounced filter to avoid frequent updates
  const debouncedFilterActiveReservations = useCallback(() => {
    // Clear any existing timer
    if (filterTimerRef.current !== null) {
      window.clearTimeout(filterTimerRef.current);
    }
    
    // Set a new timer
    filterTimerRef.current = window.setTimeout(() => {
      filterActiveReservations();
      filterTimerRef.current = null;
    }, 500);
  }, [filterActiveReservations]);

  useEffect(() => {
    // Apply filter when reservations change
    debouncedFilterActiveReservations();
    
    // Clean up the timer on unmount
    return () => {
      if (filterTimerRef.current !== null) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, [reservations, debouncedFilterActiveReservations]);

  // Setup real-time updates with optimized channel management
  useEffect(() => {
    // Set up reservation changes subscription - single channel, optimized
    const reservationsChannel = supabase
      .channel('teaching_schedule_optimized')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_reservations'
      }, () => {
        debouncedFilterActiveReservations();
      })
      .subscribe();
    
    // Use a more reasonable interval for time-based checks - every minute
    const periodicUpdateInterval = setInterval(() => {
      debouncedFilterActiveReservations();
    }, 60000);
    
    // Clean up subscriptions
    return () => {
      supabase.removeChannel(reservationsChannel);
      clearInterval(periodicUpdateInterval);
    };
  }, [debouncedFilterActiveReservations]);

  // Clean up completed reservations
  useEffect(() => {
    const checkAndDeleteCompletedReservations = async () => {
      const now = new Date();
      const expiredReservations = reservations.filter(booking => {
        const bookingDate = new Date(booking.date);
        const [endHour, endMinute] = booking.endTime.split(':').map(Number);
        
        const endDateTime = new Date(bookingDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        return endDateTime < now;
      });
      
      // Delete expired reservations efficiently with Promise.all
      if (expiredReservations.length > 0) {
        try {
          await Promise.all(expiredReservations.map(async (expired) => {
            try {
              const { error } = await supabase
                .from('room_reservations')
                .delete()
                .eq('id', expired.id);
                
              if (error) {
                console.error(`Error automatically deleting expired reservation ${expired.id}:`, error);
              } else {
                console.log(`Automatically deleted expired reservation ${expired.id}`);
              }
            } catch (err) {
              console.error(`Error processing expired reservation ${expired.id}:`, err);
            }
          }));
        } catch (error) {
          console.error("Error in batch reservation deletion:", error);
        }
      }
    };
    
    // Only run once when component mounts
    checkAndDeleteCompletedReservations();
  }, []); // Empty dependency array - run only on mount

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsCancelDialogOpen(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
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
      
      // Update local state for immediate UI update (optimistic UI)
      setFilteredReservations(prev => 
        prev.filter(r => r.id !== selectedReservation.id)
      );
      
      // Close dialog
      setIsCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
        variant: "destructive"
      });
    }
  };

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
                
                const startTimeParts = booking.startTime.split(':').map(Number);
                const endTimeParts = booking.endTime.split(':').map(Number);
                
                const startDateTime = new Date(bookingDate);
                startDateTime.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
                
                const endDateTime = new Date(bookingDate);
                endDateTime.setHours(endTimeParts[0], endTimeParts[1], 0, 0);
                
                const isActive = now >= startDateTime && now < endDateTime;
                
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
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReservation} className="bg-red-500 hover:bg-red-600">
              Yes, Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
