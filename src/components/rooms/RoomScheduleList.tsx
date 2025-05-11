
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
  
  // Format time to AM/PM if not already formatted
  const formatTimeToAMPM = (time: string): string => {
    if (time.includes('AM') || time.includes('PM')) return time;
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Convert 0 to 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Handle click internally to manage the event
  const handleCancelButtonClick = (e: React.MouseEvent, reservation: Reservation) => {
    e.stopPropagation();
    onCancelClick(reservation);
  };
  
  return (
    <div className="px-4 pb-4 text-sm">
      <h4 className="font-medium text-xs mb-2 text-muted-foreground">Upcoming Reservations:</h4>
      {roomSchedules.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {roomSchedules.map(schedule => (
            <div key={schedule.id} className="p-2 bg-accent rounded text-xs flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {new Date(schedule.date).toLocaleDateString()} 
                  ({schedule.displayStartTime || formatTimeToAMPM(schedule.startTime)}-
                  {schedule.displayEndTime || formatTimeToAMPM(schedule.endTime)})
                </p>
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
