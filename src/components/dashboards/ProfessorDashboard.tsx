
import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Users, Building, Calendar, Bell, CheckCircle, BookOpen } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ProfessorDashboardProps {
  user: User;
}

// Define the booking form schema with building and room selection
const bookingFormSchema = z.object({
  building: z.string().min(1, { message: "Building is required" }),
  roomNumber: z.string().min(1, { message: "Room number is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }).max(200, { message: "Purpose must be 200 characters or less" }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookedRooms, setBookedRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState([
    { id: '1', name: 'Main Building' },
    { id: '2', name: 'Science Complex' },
    { id: '3', name: 'Arts Center' },
    { id: '4', name: 'Technology Block' }
  ]);
  const { toast } = useToast();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      building: "",
      roomNumber: "",
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
    },
  });

  // Load bookings from localStorage on component mount
  useEffect(() => {
    const bookingsKey = `bookings-${user.id}`;
    const savedBookings = localStorage.getItem(bookingsKey);
    if (savedBookings) {
      setBookedRooms(JSON.parse(savedBookings));
    }
  }, [user.id]);

  // Check for room reservations and update status
  useEffect(() => {
    const checkRoomStatus = () => {
      // Get current date and time
      const now = new Date();
      
      // Check each booked room
      const updatedBookings = bookedRooms.map(booking => {
        const bookingDate = new Date(booking.date);
        const startTimeParts = booking.startTime.split(':');
        const endTimeParts = booking.endTime.split(':');
        
        // Create Date objects for start and end times
        const startDateTime = new Date(bookingDate);
        startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);
        
        const endDateTime = new Date(bookingDate);
        endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
        
        // Check if current time is between start and end times
        const isActive = now >= startDateTime && now < endDateTime;
        
        return {
          ...booking,
          status: isActive ? 'occupied' : 'available'
        };
      });
      
      // Update room status in localStorage
      const savedRooms = localStorage.getItem('rooms');
      if (savedRooms) {
        const rooms = JSON.parse(savedRooms);
        
        const updatedRooms = rooms.map((room: any) => {
          // Find if this room is currently booked and active
          const activeBooking = updatedBookings.find(
            booking => booking.roomNumber === room.name && booking.status === 'occupied'
          );
          
          if (activeBooking) {
            return { ...room, isAvailable: false };
          } else {
            // Only update rooms that were previously booked by this faculty
            const wasBooked = updatedBookings.find(
              booking => booking.roomNumber === room.name
            );
            
            if (wasBooked) {
              return { ...room, isAvailable: true };
            }
            
            // Return unchanged for rooms not managed by this faculty
            return room;
          }
        });
        
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
      }
      
      setBookedRooms(updatedBookings);
    };
    
    // Check room status every minute
    const intervalId = setInterval(checkRoomStatus, 60000);
    
    // Initial check
    checkRoomStatus();
    
    return () => clearInterval(intervalId);
  }, [bookedRooms, user.id]);

  const onSubmit = (data: BookingFormValues) => {
    console.log("Booking submitted:", data);
    
    // Create a new booking
    const newBooking = {
      id: `booking-${Date.now()}`,
      building: data.building,
      roomNumber: data.roomNumber,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: data.purpose,
      status: 'available', // Default status
      faculty: user.name
    };
    
    // Add to state
    const updatedBookings = [...bookedRooms, newBooking];
    setBookedRooms(updatedBookings);
    
    // Save to localStorage with user-specific key
    const bookingsKey = `bookings-${user.id}`;
    localStorage.setItem(bookingsKey, JSON.stringify(updatedBookings));
    
    // Show success toast
    toast({
      title: "Room booked successfully",
      description: `You've booked ${data.roomNumber} in ${data.building} on ${data.date} from ${data.startTime} to ${data.endTime}`,
    });
    
    // Close the dialog and reset the form
    setIsDialogOpen(false);
    form.reset();
  };

  // Get today's schedule from bookings
  const todaySchedule = bookedRooms.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate.getDate() === today.getDate() && 
           bookingDate.getMonth() === today.getMonth() && 
           bookingDate.getFullYear() === today.getFullYear();
  });

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
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a building" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building.id} value={building.name}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <span className="text-3xl font-bold">{todaySchedule.length}</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              {todaySchedule.length > 0 
                ? `Next class: ${todaySchedule[0].startTime} in ${todaySchedule[0].roomNumber}` 
                : "No classes scheduled for today"}
            </p>
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
            <CardDescription>Your booked classes and locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookedRooms.length > 0 ? (
                bookedRooms.map((booking, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={`rounded-full p-2 ${booking.status === 'occupied' ? 'bg-red-100' : 'bg-primary/10'}`}>
                      <CheckCircle className={`h-4 w-4 ${booking.status === 'occupied' ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{booking.purpose}</h4>
                      <p className="text-xs text-muted-foreground">{booking.building} - {booking.roomNumber}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-xs font-medium">
                        {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                      </span>
                      <div className="text-xs mt-1">
                        <span className={`${booking.status === 'occupied' ? 'text-red-500' : 'text-green-500'}`}>
                          {booking.status === 'occupied' ? 'In Progress' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No classes scheduled yet. Book a room to get started.</p>
              )}
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
                {name: 'Study Room 101', building: 'Main Building', features: ['Whiteboard', 'Projector']},
                {name: 'Lecture Hall 2B', building: 'Science Complex', features: ['AV Equipment', 'Tiered Seating']},
                {name: 'Meeting Room 305', building: 'Arts Center', features: ['Conference Table', 'Smart Board']}
              ].map((room, i) => (
                <div key={i} className="pb-4 border-b last:border-0">
                  <h4 className="text-sm font-medium">{room.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {room.building} • Features: {room.features.join(', ')}
                  </p>
                  <div className="mt-2">
                    <a 
                      href="#reserve" 
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDialogOpen(true);
                        form.setValue('building', room.building);
                        form.setValue('roomNumber', room.name);
                      }}
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
