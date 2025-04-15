
import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface RoomAnalyticsHeaderProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

const RoomAnalyticsHeader: React.FC<RoomAnalyticsHeaderProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">From:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 w-[130px]"
            >
              <CalendarIcon className="h-4 w-4" />
              {format(startDate, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              disabled={(date) => date > endDate || date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">To:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 w-[130px]"
            >
              <CalendarIcon className="h-4 w-4" />
              {format(endDate, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) => date < startDate || date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default RoomAnalyticsHeader;
