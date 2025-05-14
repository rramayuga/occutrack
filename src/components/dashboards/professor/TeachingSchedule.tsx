
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
  const lastProcessedRef = useRef<Set<string>>(new Set());

  // Filter out completed reservations - memoized to avoid unnecessary recalculations
  const filterActiveReservations = useCallback(() => {
    const now = new Date();
    const active = reservations.filter(booking => {
      const bookingDate = new Date(booking.date);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      
      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // Check if this is a new reservation that wasn't processed before
      if (!lastProcessedRef.current.has(booking.id)) {
        lastProcessedRef.current.add(booking.id);
      }
      
      return endDateTime > now;
    });
    
    setFilteredReservations(active);
    console.log(`[TEACHING-SCHEDULE] Filtered to ${active.length} active reservations`);
    
    // Also identify any reservations that are no longer in the source list
    // These must have been deleted in the database
    const activeIds = new Set(active.map(a => a.id));
    const currentIds = new Set(filteredReservations.map(r => r.id));
    
    currentIds.forEach(id => {
      if (!activeIds.has(id)) {
        console.log(`[TEACHING-SCHEDULE] Reservation ${id} is no longer in source data, must have been deleted`);
      }
    });
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
    }, 300);
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
      .channel('teaching_schedule_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_reservations'
      }, (payload) => {
        console.log(`[TEACHING-SCHEDULE] Received real-time update:`, payload);
        if (payload.eventType === 'DELETE') {
          // For deletions, update the UI immediately without waiting for refetch
          setFilteredReservations(prev => 
            prev.filter(r => r.id !== payload.old?.id)
          );
          console.log(`[TEACHING-SCHEDULE] Removed deleted reservation ${payload.old?.id} from UI`);
        }
        debouncedFilterActiveReservations();
      })
      .subscribe();
    
    // Use a more reasonable interval for time-based checks - every 30 seconds
    const periodicUpdateInterval = setInterval(() => {
      debouncedFilterActiveReservations();
    }, 30000);
    
    // Clean up subscriptions
    return () => {
      supabase.removeChannel(reservationsChannel);
      clearInterval(periodicUpdateInterval);
    };
  }, [debouncedFilterActiveReservations]);

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
                const isStartingSoon = now < startDateTime && ((startDateTime.getTime() - now.getTime()) < 30 * 60 * 1000); // 30 minutes
                const isEndingSoon = now < endDateTime && ((endDateTime.getTime() - now.getTime()) < 15 * 60 * 1000); // 15 minutes
                
                return (
                  <div key={booking.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={`rounded-full p-2 ${
                      isActive ? 'bg-red-100' : 
                      isStartingSoon ? 'bg-orange-100' : 
                      'bg-primary/10'
                    }`}>
                      <CheckCircle className={`h-4 w-4 ${
                        isActive ? 'text-red-500' : 
                        isStartingSoon ? 'text-orange-500' : 
                        'text-primary'
                      }`} />
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
                          <span className={`${
                            isActive ? 'text-red-500' : 
                            isStartingSoon ? 'text-orange-500' : 
                            isEndingSoon ? 'text-amber-500' :
                            (isToday ? 'text-blue-500' : 'text-green-500')
                          }`}>
                            {isActive ? 'In Progress' : 
                             isStartingSoon ? 'Starting Soon' : 
                             isEndingSoon ? 'Ending Soon' : 
                             (isToday ? 'Today' : 'Scheduled')}
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
