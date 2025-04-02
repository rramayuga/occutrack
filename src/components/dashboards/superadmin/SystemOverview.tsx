
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SystemOverview: React.FC = () => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>Global system health and statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { name: "API Services", status: "Operational", load: 42, uptime: "30d 4h" },
          { name: "Database Clusters", status: "Operational", load: 38, uptime: "45d 12h" },
          { name: "Authentication Services", status: "Operational", load: 27, uptime: "30d 4h" },
          { name: "Storage Services", status: "Operational", load: 51, uptime: "15d 7h" }
        ].map((service, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="font-medium">{service.name}</span>
              </div>
              <span className="text-muted-foreground">Uptime: {service.uptime}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${service.load}%` }} 
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Load: {service.load}%</span>
              <span>{service.status}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemOverview;
