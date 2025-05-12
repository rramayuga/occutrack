
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, Server, Globe, Shield } from 'lucide-react';

const OverviewCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">1,254</span>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Across all campuses</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-green-500">99.8%</span>
            <Server className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">All services operational</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Campuses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">5</span>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">3 in active hours</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">0</span>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">No active threats</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OverviewCards;
