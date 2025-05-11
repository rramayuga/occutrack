
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth } from "date-fns";
import RoomUsageStats from '@/components/admin/RoomUsageStats';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useRoomUsageData } from '@/hooks/useRoomUsageData';

const AnalyticsTab: React.FC = () => {
  const [startDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate] = useState<Date>(endOfMonth(new Date()));
  const { data: roomUsageData } = useRoomUsageData(startDate, endDate);

  const handleDownloadCSV = () => {
    // Skip if no data
    if (!roomUsageData || roomUsageData.length === 0) return;
    
    // Create CSV headers
    const headers = ['Room Name', 'Type', 'Capacity', 'Bookings', 'Hours Used'];
    
    // Create CSV content
    const csvContent = roomUsageData.map(room => {
      return [
        room.name || 'Unknown',
        room.type || 'Standard',
        room.capacity || '0',
        room.bookingsCount || '0',
        room.hoursUtilized || '0'
      ].join(',');
    });
    
    // Combine headers and content
    const csv = [headers.join(','), ...csvContent].join('\n');
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `room-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Usage Analysis</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="h-80 p-4">
          <RoomUsageStats />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
