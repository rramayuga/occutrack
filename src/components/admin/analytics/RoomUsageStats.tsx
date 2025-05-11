
import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import RoomAnalyticsFilters from './RoomAnalyticsFilters';
import RoomAnalyticsHeader from './RoomAnalyticsHeader';
import AnalyticsContent from './AnalyticsContent';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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

  const exportToCsv = () => {
    if (roomUsageData.length === 0) return;

    // Prepare headers
    const headers = [
      'Room Name',
      'Building',
      'Floor',
      'Type',
      'Capacity',
      'Total Bookings',
      'Hours Utilized',
      'Status'
    ];

    // Prepare data rows
    const dataRows = roomUsageData.map(room => [
      room.name,
      room.buildingName,
      room.floor.toString(),
      room.type,
      room.capacity?.toString() || '0',
      room.bookingsCount?.toString() || '0',
      room.hoursUtilized?.toFixed(2) || '0',
      room.status || 'unknown'
    ]);

    // Combine headers and data rows
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `room_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <RoomAnalyticsHeader
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => date && setStartDate(date)}
          onEndDateChange={(date) => date && setEndDate(date)}
        />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCsv}
          disabled={isLoading || roomUsageData.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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

      <div className="h-[500px] overflow-hidden">
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
    </div>
  );
};

export default RoomUsageStats;
