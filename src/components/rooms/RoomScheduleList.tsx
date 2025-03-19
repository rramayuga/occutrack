
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { Reservation } from '@/lib/types';

interface RoomScheduleListProps {
  roomSchedules: Reservation[];
  showSchedules: boolean;
  isUserFaculty: (reservation: Reservation) => boolean;
  onCancelClick: (e: React.MouseEvent, reservation: Reservation) => void;
}

const RoomScheduleList: React.FC<RoomScheduleListProps> = ({
  roomSchedules,
  showSchedules,
  isUserFaculty,
  onCancelClick
}) => {
  if (!showSchedules) return null;
  
  return (
    <div className="px-4 pb-4 text-sm">
      <h4 className="font-medium text-xs mb-2 text-muted-foreground">Upcoming Reservations:</h4>
      {roomSchedules.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {roomSchedules.map(schedule => (
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
                  onClick={(e) => onCancelClick(e, schedule)}
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
