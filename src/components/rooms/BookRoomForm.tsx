
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BuildingWithFloors, ReservationFormValues } from '@/lib/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface BookRoomFormProps {
  buildings: BuildingWithFloors[];
  onSubmit: (values: ReservationFormValues & { roomId: string }) => void;
  onCancel: () => void;
  excludeMaintenanceRooms?: boolean;
}

const formSchema = z.object({
  buildingId: z.string().min(1, "Building is required"),
  roomId: z.string().min(1, "Room is required"),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required")
    .refine((endTime, ctx) => {
      const { startTime } = ctx.parent;
      return endTime > startTime;
    }, "End time must be after start time"),
  purpose: z.string().min(1, "Purpose is required").max(500, "Purpose cannot exceed 500 characters"),
});

const BookRoomForm: React.FC<BookRoomFormProps> = ({ 
  buildings, 
  onSubmit, 
  onCancel,
  excludeMaintenanceRooms = false
}) => {
  const [availableRooms, setAvailableRooms] = useState<{ id: string; name: string }[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buildingId: "",
      roomId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      purpose: "",
    },
  });
  
  const watchBuildingId = form.watch("buildingId");
  const watchDate = form.watch("date");
  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");

  // Fetch available rooms whenever the building, date, or time changes
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!watchBuildingId) return;
      
      try {
        // Base query to get rooms for the selected building
        let query = supabase
          .from('rooms')
          .select('id, name, status')
          .eq('building_id', watchBuildingId);
        
        // If we want to exclude maintenance rooms
        if (excludeMaintenanceRooms) {
          query = query.neq('status', 'maintenance');
        }
          
        const { data: rooms, error } = await query;
        
        if (error) throw error;
        
        // If both date and times are selected, check for reservations
        if (watchDate && watchStartTime && watchEndTime) {
          const dateString = format(watchDate, 'yyyy-MM-dd');
          
          // Check for conflicting reservations for each room
          const availableRoomsPromises = rooms.map(async (room) => {
            const { data: reservations, error: reservationError } = await supabase
              .from('room_reservations')
              .select('*')
              .eq('room_id', room.id)
              .eq('date', dateString)
              .or(`start_time.lte.${watchEndTime},end_time.gte.${watchStartTime}`);
            
            if (reservationError) throw reservationError;
            
            // If there are no reservations for this time slot, the room is available
            return {
              ...room,
              isAvailable: !reservations || reservations.length === 0
            };
          });
          
          const roomsWithAvailability = await Promise.all(availableRoomsPromises);
          const filteredAvailableRooms = roomsWithAvailability.filter(room => room.isAvailable);
          setAvailableRooms(filteredAvailableRooms);
        } else {
          // If date or time not selected, show all non-maintenance rooms
          setAvailableRooms(rooms);
        }
        
      } catch (error) {
        console.error("Error fetching available rooms:", error);
      }
    };
    
    fetchAvailableRooms();
  }, [watchBuildingId, watchDate, watchStartTime, watchEndTime, excludeMaintenanceRooms]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const roomName = availableRooms.find(r => r.id === values.roomId)?.name || '';
    const buildingName = buildings.find(b => b.id === values.buildingId)?.name || '';
    
    onSubmit({
      ...values,
      roomNumber: roomName,
      building: buildingName,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="buildingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
            <FormItem>
              <FormLabel>Room</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
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
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
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
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
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
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      placeholder="--:--"
                    />
                  </FormControl>
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
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
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      placeholder="--:--"
                    />
                  </FormControl>
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
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
                  {...field} 
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Book Room
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BookRoomForm;
