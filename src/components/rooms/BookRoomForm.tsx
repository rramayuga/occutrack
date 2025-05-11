
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { useReservations } from '@/hooks/useReservations';

interface BookRoomFormProps {
  onSuccess: () => void;
}

const bookingFormSchema = z.object({
  buildingId: z.string({
    required_error: "Please select a building",
  }),
  roomId: z.string({
    required_error: "Please select a room",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  endTime: z.string({
    required_error: "Please select an end time",
  }),
  purpose: z.string().min(5, "Please provide a purpose for booking the room"),
}).refine((data) => {
  // Ensure end time is after start time
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type FormValues = z.infer<typeof bookingFormSchema>;

// Updated time slots with hour and minute formats in AM/PM
const AVAILABLE_TIMES = [
  "8:00 AM", "8:30 AM", 
  "9:00 AM", "9:30 AM", 
  "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", 
  "12:00 PM", "12:30 PM", 
  "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", 
  "3:00 PM", "3:30 PM", 
  "4:00 PM", "4:30 PM", 
  "5:00 PM", "5:30 PM", 
  "6:00 PM", "6:30 PM", 
  "7:00 PM", "7:30 PM"
];

// Helper function to convert AM/PM time to 24-hour format for database storage
const convertTo24HourFormat = (timeStr: string): string => {
  const [timePart, ampm] = timeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const BookRoomForm: React.FC<BookRoomFormProps> = ({ onSuccess }) => {
  const { buildings, rooms, refetchRooms } = useRooms();
  const { createReservation } = useReservations();
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  
  // Filter rooms to only show available rooms (not under maintenance)
  const availableRooms = rooms.filter(room => 
    room.buildingId === selectedBuilding &&
    room.status !== 'maintenance'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      purpose: '',
      date: new Date() // Default to today's date
    }
  });

  // Reset room selection when building changes
  useEffect(() => {
    if (form.watch('buildingId') !== selectedBuilding) {
      form.setValue('roomId', '');
    }
    setSelectedBuilding(form.watch('buildingId'));
  }, [form.watch('buildingId')]);

  const onSubmit = async (values: FormValues) => {
    try {
      const selectedRoom = rooms.find(r => r.id === values.roomId);
      if (!selectedRoom) return;
      
      const selectedBuilding = buildings.find(b => b.id === values.buildingId);
      if (!selectedBuilding) return;
      
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      
      // Convert times to 24-hour format for database
      const startTime24 = convertTo24HourFormat(values.startTime);
      const endTime24 = convertTo24HourFormat(values.endTime);
      
      const bookingData = {
        roomId: values.roomId,
        roomNumber: selectedRoom.name,
        building: selectedBuilding.name,
        date: formattedDate,
        startTime: startTime24,
        endTime: endTime24,
        purpose: values.purpose
      };
      
      const result = await createReservation(bookingData, values.roomId);
      
      if (result) {
        console.log("Room booked successfully:", result);
        refetchRooms();
        onSuccess();
      }
    } catch (error) {
      console.error("Error booking room:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="buildingId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Building</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
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
          name="roomId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Room</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBuilding}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
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
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        field.onChange(today);
                      }}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const tomorrow = addDays(new Date(), 1);
                        field.onChange(tomorrow);
                      }}
                    >
                      Tomorrow
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // Allow today and future dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="--:--" />
                      <Clock className="h-4 w-4 opacity-50" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVAILABLE_TIMES.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
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
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="--:--" />
                      <Clock className="h-4 w-4 opacity-50" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVAILABLE_TIMES.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Briefly describe the purpose of your booking." 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Book Room</Button>
      </form>
    </Form>
  );
};

export default BookRoomForm;
