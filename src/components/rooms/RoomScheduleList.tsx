
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
  
  const now = new Date();
  
  // Filter out completed reservations and past schedules extremely aggressively
  const activeSchedules = roomSchedules.filter(schedule => {
    // Always filter out completed reservations
    if (schedule.status === 'completed') return false;
    
    // Parse date and time to check if the schedule is finished
    const scheduleDate = new Date(schedule.date);
    
    // If schedule date is in the future, keep it
    if (scheduleDate > now) return true;
    
    // If schedule date is today, check if end time has passed
    if (scheduleDate.toDateString() === now.toDateString()) {
      const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
      
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();
      
      // Only show if end time hasn't passed yet (with zero tolerance)
      return (nowHours < endHours) || (nowHours === endHours && nowMinutes < endMinutes);
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
}

export default RoomScheduleList;
