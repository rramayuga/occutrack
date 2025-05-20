
import React, { useState, useEffect, useMemo } from 'react';
import { Building, Room, ReservationFormValues } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoomBookingDialogProps {
  buildings: Building[];
  rooms: Room[];
  createReservation: (values: ReservationFormValues, roomId: string) => Promise<any>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating?: boolean;
  connectionError?: boolean;
}

export const RoomBookingDialog: React.FC<RoomBookingDialogProps> = ({
  buildings,
  rooms,
  createReservation,
  isOpen,
  onOpenChange,
  isCreating = false,
  connectionError = false
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const { toast } = useToast();
  
  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form after closing with a small delay
      setTimeout(() => {
        setSelectedBuilding('');
        setSelectedRoom('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setPurpose('');
        setFormError(null);
        setSubmitAttempts(0);
      }, 200);
    } else {
      // Set default date to today when opening
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setFormError(null);
      
      // Set default times based on current time if during business hours
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Round current time to nearest hour for better UX
      let startHour = hour;
      if (minute > 30) startHour = hour + 1;
      if (startHour > 23) startHour = 23;
      
      // End time is start time + 1 hour
      let endHour = startHour + 1;
      if (endHour > 23) endHour = 23;
      
      const formattedStartTime = `${String(startHour).padStart(2, '0')}:00`;
      const formattedEndTime = `${String(endHour).padStart(2, '0')}:00`;
      
      // Only set these if within business hours
      if (hour >= 7 && hour < 22) {
        setStartTime(formattedStartTime);
        setEndTime(formattedEndTime);
      }
    }
  }, [isOpen]);
  
  // Sort rooms alphabetically/numerically for display
  const sortedRooms = useMemo(() => {
    return [...rooms]
      .filter(room => room.buildingId === selectedBuilding && room.status !== 'maintenance')
      .sort((a, b) => {
        // Extract numeric part if room names follow a pattern like "Room 101"
        const aMatch = a.name.match(/(\d+)/);
        const bMatch = b.name.match(/(\d+)/);
        
        if (aMatch && bMatch) {
          // If both room names contain numbers, sort numerically
          const aNum = parseInt(aMatch[0], 10);
          const bNum = parseInt(bMatch[0], 10);
          return aNum - bNum;
        }
        
        // Otherwise sort alphabetically
        return a.name.localeCompare(b.name);
      });
  }, [rooms, selectedBuilding]);

  // Sort buildings for display
  const sortedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => a.name.localeCompare(b.name));
  }, [buildings]);

  const selectedBuildingName = buildings.find(b => b.id === selectedBuilding)?.name || '';
  const selectedRoomName = rooms.find(r => r.id === selectedRoom)?.name || '';
  
  // Modified submission handler with improved validation, error handling and retry logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Check for connection issues first
    if (connectionError) {
      setFormError("Unable to create reservation due to connection issues. Please check your network connection and try again.");
      return;
    }
    
    // Increment submit attempts counter for retry tracking
    setSubmitAttempts(prev => prev + 1);
    
    // Validate form fields
    if (!selectedBuilding || !selectedRoom || !date || !startTime || !endTime) {
      setFormError("Please fill in all required fields.");
      return;
    }
    
    // Simple validation for time format
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      setFormError("Please use HH:MM format for times, e.g. 09:30");
      return;
    }
    
    // Ensure start time is before end time
    if (startTime >= endTime) {
      setFormError("End time must be after start time");
      return;
    }
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setFormError("Please select today or a future date");
      return;
    }
    
    // If it's today, make sure the start time is in the future (with a 5-minute grace period)
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      // Compare times (with 5 min grace period)
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      
      if (startTimeInMinutes < currentTimeInMinutes - 5) {
        setFormError("For today's reservations, start time must be in the future");
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating reservation with data:", {
        building: selectedBuildingName,
        roomNumber: selectedRoomName,
        date,
        startTime,
        endTime,
        purpose,
        roomId: selectedRoom
      });
      
      // Ensure all form values are properly passed
      const formValues: ReservationFormValues = {
        building: selectedBuildingName,
        roomNumber: selectedRoomName,
        date,
        startTime,
        endTime,
        purpose: purpose || ""  // Ensure purpose is never undefined
      };
      
      const result = await createReservation(formValues, selectedRoom);
      
      if (result) {
        console.log("Reservation created successfully:", result);
        onOpenChange(false);
        
        // Final confirmation toast
        toast({
          title: "Room Booked Successfully",
          description: `You've reserved ${selectedRoomName} for ${date} at ${startTime}.`,
          duration: 3000,
        });
      } else if (submitAttempts >= 3) {
        // After 3 failed attempts, suggest the user try again later
        toast({
          title: "Multiple Failed Attempts",
          description: "We're having trouble completing your reservation. Please try again later.",
          variant: "destructive",
          duration: 5000
        });
      }
      // createReservation function handles its own error toasts for other cases
    } catch (error) {
      console.error("Room booking error:", error);
      if (submitAttempts >= 3) {
        // After multiple attempts, provide more detailed error guidance
        setFormError("Unable to book the room due to connection issues. Please check your network connection and try again later.");
      } else {
        setFormError("Failed to book the room. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // If there's a network issue, show a toast instead of allowing close
      if (!open && isCreating) {
        toast({
          title: "Please wait",
          description: "Room booking is in progress...",
          duration: 3000,
        });
        return;
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
        </DialogHeader>
        
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 mr-2" />
              <AlertDescription>
                Connection error. Room booking is unavailable while offline.
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Select
              value={selectedBuilding}
              onValueChange={setSelectedBuilding}
              disabled={connectionError}
            >
              <SelectTrigger id="building">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {sortedBuildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
              disabled={!selectedBuilding || connectionError}
            >
              <SelectTrigger id="room">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {sortedRooms.length > 0 ? (
                  sortedRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} {room.status !== 'available' ? `(${room.status})` : ''}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-rooms" disabled>
                    No rooms available in this building
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={connectionError}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={connectionError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={connectionError}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Lecture, Meeting, Study Group"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={connectionError}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isCreating || connectionError}
          >
            {(isLoading || isCreating) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : connectionError ? "Connection Error" : "Book Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
