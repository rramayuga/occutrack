
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth } from "date-fns";
import RoomUsageStats from '@/components/admin/RoomUsageStats';

const AnalyticsTab: React.FC = () => {
  const [startDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate] = useState<Date>(endOfMonth(new Date()));

  return (
    <div className="space-y-6">
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
