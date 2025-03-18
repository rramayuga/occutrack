
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Calendar, Bell } from 'lucide-react';
import { Reservation } from '@/lib/types';

interface ProfessorOverviewCardsProps {
  todaySchedule: Reservation[];
  reservations: Reservation[];
}

export const ProfessorOverviewCards: React.FC<ProfessorOverviewCardsProps> = ({ 
  todaySchedule, 
  reservations 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Teaching Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{todaySchedule.length}</span>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {todaySchedule.length > 0 
              ? `Next class: ${todaySchedule[0].startTime} in ${todaySchedule[0].roomNumber}` 
              : "No classes scheduled for today"}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Office Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">4:00</span>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Today, 4:00 - 6:00 PM</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Room Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{reservations.length}</span>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Total reservations</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">5</span>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Posted this month</p>
        </CardFooter>
      </Card>
    </div>
  );
};
