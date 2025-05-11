
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
  }).refine((endTime, ctx) => {
    const startTime = ctx.data.startTime;
    if (!startTime) return true;
    return endTime > startTime;
  }, "End time must be after start time"),
  purpose: z.string().min(5, "Please provide a purpose for booking the room"),
});

type FormValues = z.infer<typeof bookingFormSchema>;

const AVAILABLE_TIMES = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

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
      purpose: ''
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
      
      const bookingData = {
        roomId: values.roomId,
        roomNumber: selectedRoom.name,
        building: selectedBuilding.name,
        date: formattedDate,
        startTime: values.startTime,
        endTime: values.endTime,
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
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
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
