
import React from 'react';
import { User } from '@/lib/types';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { TeachingSchedule } from './professor/TeachingSchedule';
import { AvailableRooms } from './professor/AvailableRooms';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const { buildings, rooms } = useRooms();
  const { reservations } = useReservations();
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => navigate('/rooms')}
            className="flex items-center gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            Book a Classroom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <TeachingSchedule reservations={reservations} />
        </div>
        <div className="col-span-1">
          <AvailableRooms rooms={rooms} buildings={buildings} />
        </div>
      </div>
    </div>
  );
};
