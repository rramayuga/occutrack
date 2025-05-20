
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startOfMonth, endOfMonth } from "date-fns";
import { Download } from "lucide-react";
import RoomUsageStats from '@/components/admin/RoomUsageStats';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const AnalyticsTab: React.FC = () => {
  const [startDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate] = useState<Date>(endOfMonth(new Date()));
  const { toast } = useToast();
  
  // Initialize with default values - will be updated by RoomUsageStats
  const { roomUsageData } = useAnalyticsData(
    startDate,
    endDate,
    'all',
    'all',
    'all'
  );
  
  const handleExport = () => {
    try {
      // Format the data for export
      const exportData = roomUsageData.map(room => ({
        'Room Name': room.roomName,
        'Building': room.buildingName,
        'Floor': room.floor,
        'Status': room.status,
        'Total Reservations': room.reservations,
        'Total Hours Used': Math.round(room.utilizationHours * 100) / 100, // Round to 2 decimal places
        'Room Utilization Rate': `${Math.round((room.utilizationHours / (8 * 20)) * 1000) / 10}%` // Assuming 8 hours per day, 20 days per month
      }));
      
      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Room Analytics');
      
      // Generate the current date for the filename
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Write the workbook and trigger download
      XLSX.writeFile(workbook, `room-analytics-${formattedDate}.xlsx`);
      
      toast({
        title: "Export successful",
        description: "Analytics data has been exported to Excel format",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting the analytics data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Room Usage Analysis</h2>
        <Button 
          variant="outline" 
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Room Usage Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="min-h-[600px]">
            <RoomUsageStats />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
