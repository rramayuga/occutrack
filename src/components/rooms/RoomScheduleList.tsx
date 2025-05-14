
import React from 'react';
import { Link } from 'react-router-dom';
import { Reservation } from '@/lib/types';
import { Button } from "@/components/ui/button";

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
  if (!showSchedules) {
    return null;
  }

  return (
    <div className="p-4 pt-0">
      <h3 className="text-sm font-medium mb-2">Room Schedule</h3>
      {roomSchedules.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {roomSchedules.map((schedule) => (
            <div key={schedule.id} className="text-xs border rounded-md p-2 bg-muted/50">
              <div className="font-medium flex justify-between items-center">
                <span>{new Date(schedule.date).toLocaleDateString()} • {schedule.startTime}-{schedule.endTime}</span>
                {isUserFaculty(schedule) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onCancelClick(schedule)}
                  >
                    ×
                  </Button>
                )}
              </div>
              <div className="text-muted-foreground mt-1 flex justify-between">
                <span>{schedule.faculty || 'Unassigned'}</span>
                <span>{schedule.purpose}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No schedules for this room.</p>
      )}
    </div>
  );
};

export default RoomScheduleList;
