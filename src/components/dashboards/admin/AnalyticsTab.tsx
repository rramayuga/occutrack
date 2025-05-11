
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { startOfMonth, endOfMonth, format } from "date-fns";
import RoomUsageStats from '@/components/admin/RoomUsageStats';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

const AnalyticsTab: React.FC = () => {
  const [startDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate] = useState<Date>(endOfMonth(new Date()));
  const { roomUsageData } = useAnalyticsData(startDate, endDate, "all", "all", "all");
  
  const handleExportCsv = () => {
    // Create CSV content
    const headers = ['Room Name', 'Building', 'Floor', 'Hours Used', 'Total Reservations', 'Status'];
    const csvRows = [headers.join(',')];
    
    roomUsageData.forEach((room) => {
      const row = [
        room.roomName,
        room.buildingName || 'Unknown',
        room.floor || '-',
        room.utilizationHours,
        room.reservations,
        room.status
      ].join(',');
      csvRows.push(row);
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `room-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden h-[500px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Usage Analysis</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCsv}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <RoomUsageStats />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
