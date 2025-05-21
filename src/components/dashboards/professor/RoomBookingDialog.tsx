
import React, { useState, useEffect } from 'react';
import { Building, Room, ReservationFormValues } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}

export const RoomBookingDialog: React.FC<RoomBookingDialogProps> = ({
  buildings,
  rooms,
  createReservation,
  isOpen,
  onOpenChange
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form after closing
      setTimeout(() => {
        setSelectedBuilding('');
        setSelectedRoom('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setPurpose('');
        setFormErrors({});
      }, 200);
    }
  }, [isOpen]);
  
  // Sort rooms alphabetically/numerically for display
  const sortedRooms = React.useMemo(() => {
    return [...rooms]
      .filter(room => room.buildingId === selectedBuilding)
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
  
  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedBuilding) {
      errors.building = "Building is required";
    }
    
    if (!selectedRoom) {
      errors.room = "Room is required";
    }
    
    if (!date) {
      errors.date = "Date is required";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = "Date cannot be in the past";
      }
    }
    
    // Simple validation for time format
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format
    
    if (!startTime) {
      errors.startTime = "Start time is required";
    } else if (!timePattern.test(startTime)) {
      errors.startTime = "Use HH:MM format";
    }
    
    if (!endTime) {
      errors.endTime = "End time is required";
    } else if (!timePattern.test(endTime)) {
      errors.endTime = "Use HH:MM format";
    }
    
    // Ensure start time is before end time
    if (startTime && endTime && timePattern.test(startTime) && timePattern.test(endTime)) {
      if (startTime >= endTime) {
        errors.endTime = "End time must be after start time";
      }
    }
    
    if (!purpose) {
      errors.purpose = "Purpose is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await createReservation({
        building: selectedBuildingName,
        roomNumber: selectedRoomName,
        date,
        startTime,
        endTime,
        purpose
      }, selectedRoom);
      
      if (result) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Room booking error:", error);
      toast({
        title: "Error",
        description: "Failed to book the room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary">Book a Room</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Select
              value={selectedBuilding}
              onValueChange={setSelectedBuilding}
            >
              <SelectTrigger id="building" className={formErrors.building ? "border-red-500" : ""}>
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
            {formErrors.building && <p className="text-xs text-red-500">{formErrors.building}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
              disabled={!selectedBuilding}
            >
              <SelectTrigger id="room" className={formErrors.room ? "border-red-500" : ""}>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {sortedRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.room && <p className="text-xs text-red-500">{formErrors.room}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={formErrors.date ? "border-red-500" : ""}
            />
            {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={formErrors.startTime ? "border-red-500" : ""}
              />
              {formErrors.startTime && <p className="text-xs text-red-500">{formErrors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={formErrors.endTime ? "border-red-500" : ""}
              />
              {formErrors.endTime && <p className="text-xs text-red-500">{formErrors.endTime}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Lecture, Meeting, Study Group"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={formErrors.purpose ? "border-red-500" : ""}
            />
            {formErrors.purpose && <p className="text-xs text-red-500">{formErrors.purpose}</p>}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Booking..." : "Book Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
