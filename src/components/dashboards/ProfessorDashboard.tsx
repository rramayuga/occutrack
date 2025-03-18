
import React, { useState } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Users, Building, Calendar, Bell, CheckCircle, BookOpen } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ProfessorDashboardProps {
  user: User;
}

// Define the booking form schema
const bookingFormSchema = z.object({
  roomNumber: z.string().min(1, { message: "Room number is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }).max(200, { message: "Purpose must be 200 characters or less" }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      roomNumber: "",
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    console.log("Booking submitted:", data);
    
    // In a real app, we would save this to a database
    // For now, we'll just show a success message
    toast({
      title: "Room booked successfully",
      description: `You've booked ${data.roomNumber} on ${data.date} from ${data.startTime} to ${data.endTime}`,
    });
    
    // Close the dialog and reset the form
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0" size="lg">
              <BookOpen className="mr-2 h-4 w-4" /> Book a Classroom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book a Classroom</DialogTitle>
              <DialogDescription>
                Enter the details of the room you want to book and the time slot.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 305, Lab 2B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe why you need this room" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe the purpose of your booking.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Book Room</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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
