
import React from 'react';
import { RoomUsageData } from '../types/room';
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import RoomUsageChart from './RoomUsageChart';
import RoomUsageCards from './RoomUsageCards';

interface RoomAnalyticsLayoutProps {
  isLoading: boolean;
  roomUsageData: RoomUsageData[];
}

const RoomAnalyticsLayout: React.FC<RoomAnalyticsLayoutProps> = ({ 
  isLoading, 
  roomUsageData 
}) => {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  if (roomUsageData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No room usage data available for the selected filters.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or selecting a different date range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px] w-full">
        <RoomUsageChart data={roomUsageData} />
      </div>
      <RoomUsageCards data={roomUsageData} />
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
            <p>Data is updated in real-time as reservations change.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomAnalyticsLayout;
