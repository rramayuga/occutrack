import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building, Calendar, Bell, CheckCircle, BookOpen } from 'lucide-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const { buildings, rooms } = useRooms();
  const { reservations, createReservation } = useReservations();
  
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

  // Get today's schedule from reservations
  const todaySchedule = reservations.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate.getDate() === today.getDate() && 
           bookingDate.getMonth() === today.getMonth() && 
           bookingDate.getFullYear() === today.getFullYear();
  });

  // Handle building selection
  const handleBuildingChange = (value: string) => {
    const building = buildings.find(b => b.name === value);
    if (building) {
      form.setValue('building', value);
      setSelectedBuilding(building.id);
      // Reset room selection when building changes
      form.setValue('roomNumber', '');
      setSelectedRoomId("");
    }
  };

  // Handle room selection
  const handleRoomChange = (roomName: string) => {
    const room = getBuildingRooms().find(r => r.name === roomName);
    if (room) {
      form.setValue('roomNumber', roomName);
      setSelectedRoomId(room.id);
    }
  };

  // Get room options for selected building
  const getBuildingRooms = () => {
    // If no building is selected, return empty array
    if (!selectedBuilding) return [];
    
    // Get rooms for the building
    return rooms.filter(room => room.buildingId === selectedBuilding);
  };

  const onSubmit = async (data: BookingFormValues) => {
    console.log("Booking submitted:", data, "Room ID:", selectedRoomId);
    
    if (!selectedRoomId) {
      form.setError("roomNumber", { 
        type: "manual", 
        message: "Invalid room selection" 
      });
      return;
    }
    
    const result = await createReservation(data, selectedRoomId);
    if (result) {
      setIsDialogOpen(false);
      form.reset();
    }
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
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <Select
                        onValueChange={(value) => handleBuildingChange(value)}
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
                      <FormLabel>Room</FormLabel>
                      <Select
                        onValueChange={(value) => handleRoomChange(value)}
                        defaultValue={field.value}
                        disabled={!selectedBuilding}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getBuildingRooms().map((room) => (
                            <SelectItem key={room.id} value={room.name}>
                              {room.name} ({room.type})
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
              <span className="text-3xl font-bold">{reservations.length}</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Total reservations</p>
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
              {reservations.length > 0 ? (
                reservations.map((booking) => {
                  // Determine if the booking is currently active
                  const now = new Date();
                  const bookingDate = new Date(booking.date);
                  const today = new Date();
                  const isToday = bookingDate.getDate() === today.getDate() && 
                                bookingDate.getMonth() === today.getMonth() && 
                                bookingDate.getFullYear() === today.getFullYear();
                  
                  const startTimeParts = booking.startTime.split(':');
                  const endTimeParts = booking.endTime.split(':');
                  
                  const startDateTime = new Date(bookingDate);
                  startDateTime.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);
                  
                  const endDateTime = new Date(bookingDate);
                  endDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
                  
                  const isActive = now >= startDateTime && now < endDateTime;
                  
                  return (
                    <div key={booking.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className={`rounded-full p-2 ${isActive ? 'bg-red-100' : 'bg-primary/10'}`}>
                        <CheckCircle className={`h-4 w-4 ${isActive ? 'text-red-500' : 'text-primary'}`} />
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
                          <span className={`${isActive ? 'text-red-500' : (isToday ? 'text-orange-500' : 'text-green-500')}`}>
                            {isActive ? 'In Progress' : (isToday ? 'Today' : 'Scheduled')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
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
              {rooms.filter(room => room.isAvailable).slice(0, 3).length > 0 ? (
                rooms.filter(room => room.isAvailable).slice(0, 3).map((room) => {
                  const building = buildings.find(b => b.id === room.buildingId);
                  return (
                    <div key={room.id} className="pb-4 border-b last:border-0">
                      <h4 className="text-sm font-medium">{room.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {building?.name || 'Unknown Building'} • Type: {room.type}
                      </p>
                      <div className="mt-2">
                        <a 
                          href="#reserve" 
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            if (building) {
                              setIsDialogOpen(true);
                              form.setValue('building', building.name);
                              form.setValue('roomNumber', room.name);
                              setSelectedBuilding(building.id);
                              setSelectedRoomId(room.id);
                            }
                          }}
                        >
                          Reserve
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">No available rooms found.</p>
              )}
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
