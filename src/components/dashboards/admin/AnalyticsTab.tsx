
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import RoomUsageStats from '@/components/admin/RoomUsageStats';
import { useRoomUsageData } from '@/hooks/useRoomUsageData';

const AnalyticsTab: React.FC = () => {
  const [startDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate] = useState<Date>(endOfMonth(new Date()));
  
  const { roomUsageData, isLoading } = useRoomUsageData();
  
  const exportToCSV = () => {
    if (!roomUsageData || roomUsageData.length === 0) return;
    
    // Prepare CSV content
    const headers = ['Room', 'Type', 'Capacity', 'Total Bookings', 'Hours Utilized', 'Utilization Rate'];
    
    const csvContent = roomUsageData.map(room => 
      [
        room.roomName || 'N/A',
        room.roomType || 'N/A',
        room.capacity || '0',
        room.totalBookings || '0',
        room.hoursBooked || '0',
        `${room.utilizationRate || '0'}%`
      ].join(',')
    );
    
    // Add headers to the beginning
    csvContent.unshift(headers.join(','));
    
    // Create a Blob and download
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `room-usage-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Usage Analysis</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-2 items-center"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="h-[450px] overflow-auto">
            <RoomUsageStats />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
