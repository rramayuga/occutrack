
import React from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Clock, BookOpen, Building } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">4</span>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">2 classes today</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">23</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">5 study rooms, 18 classrooms</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">2</span>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Next: Study Room 101 at 3PM</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">12.5</span>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">This week</p>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Room Usage</CardTitle>
            <CardDescription>Your study and classroom activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="rounded-full p-2 bg-primary/10">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Study Room {100 + i}</h4>
                    <p className="text-xs text-muted-foreground">May {10 + i}, 2023 · 2 hours</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs font-medium">{2 + i} PM - {4 + i} PM</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <a href="/rooms" className="text-sm text-primary hover:underline">View all rooms</a>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Announcements</CardTitle>
            <CardDescription>Latest campus updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="pb-4 border-b last:border-0">
                  <h4 className="text-sm font-medium">Library Hours Extended</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    The university library will now be open until midnight during finals week.
                  </p>
                  <span className="text-xs text-muted-foreground">May {10 + i}, 2023</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <a href="/announcements" className="text-sm text-primary hover:underline">View all announcements</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
