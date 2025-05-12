import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Room, Building, ReservationFormValues } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import DateSelectionButtons from "./DateSelectionButtons";
import TimePickerField from "./TimePickerField";

// Define the schema for the form
const bookingFormSchema = z.object({
  roomId: z.string().min(1, { message: "Please select a room" }),
  date: z.string().min(1, { message: "Please select a date" }),
  startTime: z.string().min(1, { message: "Please select a start time" }),
  endTime: z.string().min(1, { message: "Please select an end time" }),
  purpose: z
    .string()
    .min(3, { message: "Purpose must be at least 3 characters" })
    .max(100, { message: "Purpose must be less than 100 characters" }),
});

interface BookRoomFormProps {
  rooms: Room[];
  buildings: Building[];
  onSubmit: (values: ReservationFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function BookRoomForm({ rooms, buildings, onSubmit, isSubmitting }: BookRoomFormProps) {
  const { toast } = useToast();
  const [selectedBuilding, setSelectedBuilding] = React.useState<string | null>(null);
  const [filteredRooms, setFilteredRooms] = React.useState<Room[]>([]);

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      roomId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "8:00 AM",
      endTime: "9:00 AM",
      purpose: "",
    },
  });

  // Filter rooms when building selection changes
  React.useEffect(() => {
    if (selectedBuilding) {
      const buildingRooms = rooms.filter((room) => room.buildingId === selectedBuilding);
      setFilteredRooms(buildingRooms);
    } else {
      setFilteredRooms([]);
    }
  }, [selectedBuilding, rooms]);

  // Custom submit handler
  const handleSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
    // Find the selected room to get building and room name
    const selectedRoom = rooms.find((room) => room.id === values.roomId);
    if (!selectedRoom) return;

    const building = buildings.find((b) => b.id === selectedRoom.buildingId);
    if (!building) return;

    // Check if end time is after start time
    const [startHour, startMinute, startPeriod] = values.startTime.split(/[: ]/);
    const [endHour, endMinute, endPeriod] = values.endTime.split(/[: ]/);
    
    let start = parseInt(startHour);
    let end = parseInt(endHour);
    
    // Convert to 24-hour format for comparison
    if (startPeriod === "PM" && start !== 12) start += 12;
    if (startPeriod === "AM" && start === 12) start = 0;
    if (endPeriod === "PM" && end !== 12) end += 12;
    if (endPeriod === "AM" && end === 12) end = 0;
    
    if (start >= end) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Convert times to 24-hour format for storage
    const formatTimeFor24Hour = (timeString: string) => {
      const [time, period] = timeString.split(" ");
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);
      
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      
      return `${hour.toString().padStart(2, "0")}:${minutes}`;
    };

    // Create reservation object for submission - ensure all required fields are present
    const reservationData: ReservationFormValues = {
      roomId: values.roomId,
      startTime: formatTimeFor24Hour(values.startTime),
      endTime: formatTimeFor24Hour(values.endTime),
      roomNumber: selectedRoom.name,
      building: building.name,
      date: values.date,
      purpose: values.purpose,
    };

    try {
      await onSubmit(reservationData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to book room. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                        format(new Date(field.value), "PPP")
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
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => date && field.onChange(format(date, "yyyy-MM-dd"))}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <DateSelectionButtons onSelect={(date) => field.onChange(date)} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimePickerField 
            control={form.control}
            name="startTime"
            label="Start Time"
          />
          
          <TimePickerField 
            control={form.control}
            name="endTime"
            label="End Time"
          />
        </div>

        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <Select 
                onValueChange={(value) => {
                  setSelectedBuilding(value);
                  // Reset room selection when building changes
                  form.setValue("roomId", "");
                }}
              >
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
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedBuilding}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredRooms.map((room) => (
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
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe why you need this room"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please provide a brief description of your activity.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Room"}
        </Button>
      </form>
    </Form>
  );
}
