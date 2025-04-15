
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoomUsageStats from '@/components/admin/RoomUsageStats';

const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Room Usage Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomUsageStats />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
