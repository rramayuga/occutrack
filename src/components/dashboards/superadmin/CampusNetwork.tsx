
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from 'lucide-react';

const CampusNetwork: React.FC = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Campus Network Overview</CardTitle>
        <CardDescription>Activity across all connected campuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { campus: "Main Campus", users: 480, rooms: 120, occupancy: 67, statusColor: "bg-green-500" },
            { campus: "North Campus", users: 320, rooms: 85, occupancy: 54, statusColor: "bg-green-500" },
            { campus: "West Wing", users: 250, rooms: 62, occupancy: 48, statusColor: "bg-green-500" },
            { campus: "Science Center", users: 140, rooms: 30, occupancy: 73, statusColor: "bg-green-500" },
            { campus: "Technology Park", users: 64, rooms: 15, occupancy: 32, statusColor: "bg-amber-500" }
          ].map((campus, i) => (
            <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className={`mt-1 w-2 h-2 rounded-full ${campus.statusColor}`}></div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{campus.campus}</h4>
                <div className="flex items-center mt-1">
                  <Network className="h-3 w-3 text-muted-foreground mr-1" />
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">{campus.users} users</div>
                <div className="text-xs text-muted-foreground">{campus.rooms} rooms ({campus.occupancy}% occupied)</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <a href="/admin/campuses" className="text-sm text-primary hover:underline">Manage all campuses</a>
      </CardFooter>
    </Card>
  );
};

export default CampusNetwork;
