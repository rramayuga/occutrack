
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
    </div>
  );
};
