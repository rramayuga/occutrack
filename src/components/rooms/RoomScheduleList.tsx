import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { Reservation } from '@/lib/types';

interface RoomScheduleListProps {
  roomSchedules: Reservation[];
  showSchedules: boolean;
  isUserFaculty: (reservation: Reservation) => boolean;
  onCancelClick: (reservation: Reservation) => void;
}

const RoomScheduleList: React.FC<RoomScheduleListProps> = ({
  roomSchedules,
  showSchedules,
  isUserFaculty,
  onCancelClick
}) => {
  if (!showSchedules) return null;
  
  // Get current date and time for filtering
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  
  // Filter out completed/finished schedules with improved logic
  const activeSchedules = roomSchedules.filter(schedule => {
    // Filter out explicitly completed reservations
    if (schedule.status === 'completed') {
      return false;
    }
    
    // If schedule date is in the future, keep it
    if (schedule.date > today) {
      return true;
    }
    
    // If schedule date is today, check if end time has passed
    if (schedule.date === today) {
      // Convert times to minutes for accurate comparison
      const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
      const [nowHours, nowMinutes] = currentTime.split(':').map(Number);
      
      const endInMinutes = endHours * 60 + endMinutes;
      const nowInMinutes = nowHours * 60 + nowMinutes;
      
      // Keep if end time hasn't passed yet
      return endInMinutes > nowInMinutes;
    }
    
    // Schedule date is in the past
    return false;
  });
  
  // Handle click internally to manage the event
  const handleCancelButtonClick = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    onCancelClick(reservation);
  };
  
  return (
    <div className="px-4 pb-4 text-sm">
      <h4 className="font-medium text-xs mb-2 text-muted-foreground">Upcoming Reservations:</h4>
      {activeSchedules.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {activeSchedules.map(schedule => (
            <div key={schedule.id} className="p-2 bg-accent rounded text-xs flex justify-between items-center">
              <div>
                <p className="font-medium">{new Date(schedule.date).toLocaleDateString()} ({schedule.startTime}-{schedule.endTime})</p>
                <p className="text-muted-foreground">{schedule.faculty}</p>
                <p className="text-muted-foreground">{schedule.purpose}</p>
              </div>
              {isUserFaculty(schedule) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleCancelButtonClick(e, schedule)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No upcoming reservations</p>
      )}
    </div>
  );
};

export default RoomScheduleList;
