
import React from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, Building, AlertTriangle, Bell, ClipboardList } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">452</span>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">12 pending approvals</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">56</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">45 currently occupied</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">7</span>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">3 high priority</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">15</span>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Posted this month</p>
          </CardFooter>
        </Card>
      </div>

      {/* Main Admin Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Facility Usage Overview</CardTitle>
            <CardDescription>Current occupancy by building</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { building: "Main Hall", rooms: 24, occupied: 20, percentage: 83 },
              { building: "Science Building", rooms: 18, occupied: 15, percentage: 83 },
              { building: "Library", rooms: 14, occupied: 10, percentage: 71 }
            ].map((building, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{building.building}</span>
                  <span className="text-muted-foreground">{building.occupied} / {building.rooms} rooms occupied</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${building.percentage}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Account and room requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="pb-3 border-b">
                <h4 className="text-sm font-medium mb-1">User Accounts</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">12 pending</span>
                  <a 
                    href="/admin/approvals" 
                    className="text-xs text-primary hover:underline"
                  >
                    Review
                  </a>
                </div>
              </div>
              
              <div className="pb-3 border-b">
                <h4 className="text-sm font-medium mb-1">Room Reservations</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">8 pending</span>
                  <a 
                    href="/admin/rooms" 
                    className="text-xs text-primary hover:underline"
                  >
                    Review
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Maintenance Tickets</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">7 open</span>
                  <a 
                    href="/admin/maintenance" 
                    className="text-xs text-primary hover:underline"
                  >
                    Review
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "User Approved", details: "Alan Smith (Student) approved by Jane Admin", time: "10 minutes ago" },
              { action: "Room Reserved", details: "Room 305 reserved for CS Department Meeting", time: "25 minutes ago" },
              { action: "Maintenance Request", details: "Projector issue reported in Lecture Hall 2", time: "1 hour ago" },
              { action: "Building Hours Updated", details: "Library hours extended for finals week", time: "2 hours ago" },
              { action: "System Alert", details: "Scheduled maintenance on Sunday, 2:00 AM", time: "3 hours ago" }
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className="rounded-full p-2 bg-muted">
                  <ClipboardList className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{activity.action}</h4>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <a href="/admin/logs" className="text-sm text-primary hover:underline">View complete logs</a>
        </CardFooter>
      </Card>
    </div>
  );
};
