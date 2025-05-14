
import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from 'lucide-react';
import { BuildingWithFloors, Room, ReservationFormValues } from '@/lib/types';

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

interface RoomBookingDialogProps {
  buildings: BuildingWithFloors[];
  rooms: Room[];
  createReservation: (data: ReservationFormValues, roomId: string) => Promise<any>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoomBookingDialog: React.FC<RoomBookingDialogProps> = ({ 
  buildings, 
  rooms, 
  createReservation, 
  isOpen, 
  onOpenChange 
}) => {
  const [selectedBuilding, setSelectedBuilding] = React.useState("");
  const [selectedRoomId, setSelectedRoomId] = React.useState("");
  
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
    
    // Ensure we're passing a complete ReservationFormValues object
    const reservationData: ReservationFormValues = {
      building: data.building,
      roomNumber: data.roomNumber,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: data.purpose
    };
    
    const result = await createReservation(reservationData, selectedRoomId);
    if (result) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
  );
};
