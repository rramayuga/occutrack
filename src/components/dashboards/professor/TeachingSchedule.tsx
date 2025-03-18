
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import { Reservation } from '@/lib/types';

interface TeachingScheduleProps {
  reservations: Reservation[];
}

export const TeachingSchedule: React.FC<TeachingScheduleProps> = ({ reservations }) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Teaching Schedule</CardTitle>
        <CardDescription>Your booked classes and locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservations.length > 0 ? (
            reservations.map((booking) => {
              // Determine if the booking is currently active
              const now = new Date();
              const bookingDate = new Date(booking.date);
              const today = new Date();
              const isToday = bookingDate.getDate() === today.getDate() && 
                            bookingDate.getMonth() === today.getMonth() && 
                            bookingDate.getFullYear() === today.getFullYear();
              
              const startTimeParts = booking.startTime.split(':');
              const endTimeParts = booking.endTime.split(':');
              
              const startDateTime = new Date(bookingDate);
              startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);
              
              const endDateTime = new Date(bookingDate);
              endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
              
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
                  <div className="ml-auto text-right">
                    <span className="text-xs font-medium">
                      {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                    </span>
                    <div className="text-xs mt-1">
                      <span className={`${isActive ? 'text-red-500' : (isToday ? 'text-orange-500' : 'text-green-500')}`}>
                        {isActive ? 'In Progress' : (isToday ? 'Today' : 'Scheduled')}
                      </span>
                    </div>
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
  );
};
