
import React from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Calendar, Bell, CheckCircle } from 'lucide-react';

interface ProfessorDashboardProps {
  user: User;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teaching Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">3</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Next class: 2:00 PM in Room 305</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Office Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">4:00</span>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Today, 4:00 - 6:00 PM</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Room Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">2</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">5</span>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Posted this month</p>
          </CardFooter>
        </Card>
      </div>

      {/* Teaching Schedule & Room Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Teaching Schedule</CardTitle>
            <CardDescription>Today's classes and locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {time: '10:00 AM - 11:30 AM', course: 'Computer Science 101', room: 'Lecture Hall 1A'},
                {time: '2:00 PM - 3:30 PM', course: 'Algorithm Design', room: 'Room 305'},
                {time: '4:00 PM - 5:30 PM', course: 'Advanced Database Systems', room: 'Computer Lab 2'}
              ].map((schedule, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="rounded-full p-2 bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{schedule.course}</h4>
                    <p className="text-xs text-muted-foreground">{schedule.room}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs font-medium">{schedule.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
            <CardDescription>Currently available rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {name: 'Study Room 101', capacity: 8, features: ['Whiteboard', 'Projector']},
                {name: 'Lecture Hall 2B', capacity: 120, features: ['AV Equipment', 'Tiered Seating']},
                {name: 'Meeting Room 305', capacity: 15, features: ['Conference Table', 'Smart Board']}
              ].map((room, i) => (
                <div key={i} className="pb-4 border-b last:border-0">
                  <h4 className="text-sm font-medium">{room.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacity: {room.capacity} • {room.features.join(', ')}
                  </p>
                  <div className="mt-2">
                    <a 
                      href="#reserve" 
                      className="text-xs text-primary hover:underline"
                    >
                      Reserve
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <a href="/rooms" className="text-sm text-primary hover:underline">View all rooms</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
