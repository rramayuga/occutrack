
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Settings, Users, BarChart } from 'lucide-react';

interface DashboardCardProps {
  buildings: number;
  rooms: number;
  facultyCount: number;
  utilizationRate: string;
}

const AdminDashboardCards: React.FC<DashboardCardProps> = ({
  buildings,
  rooms,
  facultyCount,
  utilizationRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{buildings}</span>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{rooms}</span>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{facultyCount}</span>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{utilizationRate}</span>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCards;
