
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RoomAnalyticsFilters from './analytics/RoomAnalyticsFilters';
import RoomAnalyticsLayout from './analytics/RoomAnalyticsLayout';
import { useRoomUsageData } from '@/hooks/useRoomUsageData';

interface Building {
  id: string;
  name: string;
}

const RoomUsageStats = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name');
      
      if (!error && data) {
        const typedBuildings: Building[] = data.map(building => ({
          id: building.id,
          name: building.name
        }));
        setBuildings(typedBuildings);
      }
    };
    
    fetchBuildings();
  }, []);

  const { roomUsageData, isLoading } = useRoomUsageData(
    startDate,
    endDate,
    selectedBuilding,
    selectedFloor,
    statusFilter
  );

  const getFloors = () => {
    const floors = new Set<number>();
    roomUsageData.forEach(room => floors.add(room.floor));
    return Array.from(floors).sort((a, b) => a - b);
  };

  return (
    <div className="space-y-4">
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
                onSelect={(date) => date && setStartDate(date)}
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
                onSelect={(date) => date && setEndDate(date)}
                disabled={(date) => date < startDate || date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <RoomAnalyticsFilters
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          buildings={buildings}
          floors={getFloors()}
        />
      </div>

      <RoomAnalyticsLayout
        isLoading={isLoading}
        roomUsageData={roomUsageData}
      />
    </div>
  );
};

export default RoomUsageStats;
