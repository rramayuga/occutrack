
import React from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Server, Network, UsersRound, Globe, Settings, Bell, Lock, Database } from 'lucide-react';

interface SuperAdminDashboardProps {
  user: User;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Super Administrator Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      {/* Overview Cards */}
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

      {/* System Status and Admin Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Super Admin Tools</CardTitle>
            <CardDescription>System-wide controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Database Management</h4>
                  <p className="text-xs text-muted-foreground">Configure and optimize databases</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">System Configuration</h4>
                  <p className="text-xs text-muted-foreground">Global application settings</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Security Controls</h4>
                  <p className="text-xs text-muted-foreground">Manage authentication and access</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Notification Center</h4>
                  <p className="text-xs text-muted-foreground">Manage system notifications</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Campus Overview */}
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
    </div>
  );
};
