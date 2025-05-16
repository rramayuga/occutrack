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
  
  // Compare times in HH:MM format for better accuracy
  const compareTimeStrings = (time1: string, time2: string): number => {
    // Parse times to ensure proper comparison
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    // Convert to minutes for easier comparison
    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;
    
    return totalMinutes1 - totalMinutes2;
  };
  
  // Filter out finished/completed schedules with improved logic
  const activeSchedules = roomSchedules.filter(schedule => {
    // Filter out explicitly completed reservations
    if (schedule.status === 'completed') {
      return false;
    }
    
    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0'); // HH:MM format
    
    // If schedule date is in the future, keep it
    if (schedule.date > today) {
      return true;
    }
    
    // If schedule date is today, check if end time has passed
    if (schedule.date === today) {
      return compareTimeStrings(currentTime, schedule.endTime) < 0;
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
