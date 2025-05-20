
import React, { useState, useEffect } from 'react';
import { Building, Room, ReservationFormValues } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface RoomBookingDialogProps {
  buildings: Building[];
  rooms: Room[];
  createReservation: (values: ReservationFormValues, roomId: string) => Promise<any>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating?: boolean;
}

export const RoomBookingDialog: React.FC<RoomBookingDialogProps> = ({
  buildings,
  rooms,
  createReservation,
  isOpen,
  onOpenChange,
  isCreating = false
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
      }, 200);
    } else {
      // Set default date to today when opening
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setFormError(null);
    }
  }, [isOpen]);
  
  // Sort rooms alphabetically/numerically for display
  const sortedRooms = React.useMemo(() => {
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
  const sortedBuildings = React.useMemo(() => {
    return [...buildings].sort((a, b) => a.name.localeCompare(b.name));
  }, [buildings]);

  const selectedBuildingName = buildings.find(b => b.id === selectedBuilding)?.name || '';
  const selectedRoomName = rooms.find(r => r.id === selectedRoom)?.name || '';
  
  // Modified submission handler with improved validation and error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
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
      } 
      // createReservation function handles its own error toasts
    } catch (error) {
      console.error("Room booking error:", error);
      setFormError("Failed to book the room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
        </DialogHeader>
        
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 text-sm">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Select
              value={selectedBuilding}
              onValueChange={setSelectedBuilding}
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
              disabled={!selectedBuilding}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading || isCreating}>
            {(isLoading || isCreating) ? "Booking..." : "Book Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
