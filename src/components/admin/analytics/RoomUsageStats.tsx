
import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import RoomAnalyticsFilters from './RoomAnalyticsFilters';
import RoomAnalyticsHeader from './RoomAnalyticsHeader';
import AnalyticsContent from './AnalyticsContent';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const RoomUsageStats: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { roomUsageData, isLoading } = useAnalyticsData(
    startDate,
    endDate,
    selectedBuilding,
    selectedFloor,
    statusFilter
  );

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name');
      
      if (!error && data) {
        setBuildings(data);
      }
    };
    
    fetchBuildings();
  }, []);

  const getFloors = () => {
    const floors = new Set<number>();
    roomUsageData.forEach(room => floors.add(room.floor));
    return Array.from(floors).sort((a, b) => a - b);
  };

  const totalPages = Math.ceil(roomUsageData.length / 10);
  const currentPageData = roomUsageData.slice((currentPage - 1) * 10, currentPage * 10);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      <RoomAnalyticsHeader
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(date) => date && setStartDate(date)}
        onEndDateChange={(date) => date && setEndDate(date)}
      />

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

      <AnalyticsContent 
        isLoading={isLoading}
        roomUsageData={roomUsageData}
        currentPage={currentPage}
        totalPages={totalPages}
        currentPageData={currentPageData}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
      />
    </div>
  );
};

export default RoomUsageStats;
