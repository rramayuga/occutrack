import { useState, useEffect } from 'react';
import { BuildingWithFloors, Room } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useRooms() {
  const [buildings, setBuildings] = useState<BuildingWithFloors[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      
      // Fetch buildings from Supabase
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      
      if (buildingsError) {
        throw buildingsError;
      }
      
      if (buildingsData && buildingsData.length > 0) {
        // Transform to BuildingWithFloors format
        const buildingsWithFloors: BuildingWithFloors[] = buildingsData.map(building => ({
          id: building.id,
          name: building.name,
          floors: Array.from({ length: building.floors }, (_, i) => i + 1),
          roomCount: 0 // This will be updated after fetching rooms
        }));
        
        console.log("Fetched buildings:", buildingsWithFloors);
        setBuildings(buildingsWithFloors);
        
        if (buildingsWithFloors.length > 0 && !selectedBuilding) {
          setSelectedBuilding(buildingsWithFloors[0].id);
        }
      } else {
        console.log("No buildings found in Supabase");
        setBuildings([]);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast({
        title: "Error loading buildings",
        description: "Could not load buildings data from server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      // Fetch rooms from Supabase
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      
      if (roomsError) {
        throw roomsError;
      }
      
      if (roomsData) {
        // Get the latest availability status for each room
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('room_availability')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (availabilityError) {
          console.error("Error fetching room availability:", availabilityError);
        }
        
        // Create a map of room IDs to their latest availability status
        const availabilityMap = new Map();
        if (availabilityData) {
          availabilityData.forEach(record => {
            if (!availabilityMap.has(record.room_id)) {
              availabilityMap.set(record.room_id, record.is_available);
            }
          });
        }
        
        // Transform to Room format with availability from the map or default to true
        const roomsWithAvailability: Room[] = roomsData.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          isAvailable: availabilityMap.has(room.id) ? availabilityMap.get(room.id) : true,
          floor: room.floor,
          buildingId: room.building_id
        }));
        
        console.log("Fetched rooms:", roomsWithAvailability);
        setRooms(roomsWithAvailability);
        
        // Update building room counts
        const buildingCounts = roomsData.reduce((acc: {[key: string]: number}, room) => {
          const buildingId = room.building_id;
          acc[buildingId] = (acc[buildingId] || 0) + 1;
          return acc;
        }, {});
        
        setBuildings(prev => prev.map(building => ({
          ...building,
          roomCount: buildingCounts[building.id] || 0
        })));
      } else {
        console.log("No rooms found in Supabase");
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error loading rooms",
        description: "Could not load rooms data from server.",
        variant: "destructive"
      });
    }
  };

  const handleToggleRoomAvailability = async (roomId: string) => {
    // Only allow faculty to toggle room availability
    if (user?.role !== 'faculty') {
      if (user?.role === 'student') {
        toast({
          title: "Access Denied",
          description: "Students cannot change room availability.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      // Find the room to toggle
      const roomToToggle = rooms.find(room => room.id === roomId);
      if (!roomToToggle) return;

      // Create a custom room_availability record
      const { error } = await supabase
        .from('room_availability')
        .insert({
          room_id: roomId, 
          is_available: !roomToToggle.isAvailable,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Update local state
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId) {
          // Toggle the availability
          const updatedRoom = { ...room, isAvailable: !room.isAvailable };
          
          // Show a toast notification
          toast({
            title: updatedRoom.isAvailable ? "Room Available" : "Room Occupied",
            description: `${updatedRoom.name} is now ${updatedRoom.isAvailable ? 'available' : 'occupied'}.`,
            variant: updatedRoom.isAvailable ? "default" : "destructive"
          });
          
          return updatedRoom;
        }
        return room;
      });
      
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Error toggling room availability:", error);
      toast({
        title: "Error",
        description: "Failed to update room availability.",
        variant: "destructive"
      });
    }
  };

  const setupRoomSubscription = () => {
    const roomChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, (payload) => {
        console.log('Room change received:', payload);
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  };

  const setupRoomAvailabilitySubscription = () => {
    const availabilityChannel = supabase
      .channel('room_availability_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_availability' 
      }, (payload) => {
        console.log('Room availability change received:', payload);
        fetchRooms(); // Refresh rooms to get the latest availability
      })
      .subscribe();

    return () => {
      supabase.removeChannel(availabilityChannel);
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchBuildings();
      await fetchRooms();
    };
    
    fetchData();
    
    // Set up real-time subscriptions
    const unsubscribeRooms = setupRoomSubscription();
    const unsubscribeAvailability = setupRoomAvailabilitySubscription();
    
    return () => {
      unsubscribeRooms();
      unsubscribeAvailability();
    };
  }, []);

  useEffect(() => {
    const updateRoomStatusBasedOnBookings = async () => {
      if (!user) return;
      
      try {
        // Get current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
        
        // Fetch today's reservations
        const { data: reservations, error } = await supabase
          .from('room_reservations')
          .select('*')
          .eq('date', currentDate);
        
        if (error) throw error;
        
        if (reservations && reservations.length > 0) {
          console.log('Checking reservations for updates:', reservations);
          
          for (const reservation of reservations) {
            const startTime = reservation.start_time;
            const endTime = reservation.end_time;
            
            // Check if current time is between start and end times
            const isActive = currentTime >= startTime && currentTime < endTime;
            
            // Find the room
            const roomToUpdate = rooms.find(r => r.id === reservation.room_id);
            
            if (roomToUpdate) {
              // Only update if status needs to change
              if ((isActive && roomToUpdate.isAvailable) || (!isActive && !roomToUpdate.isAvailable)) {
                await supabase
                  .from('rooms')
                  .update({ is_available: !isActive })
                  .eq('id', reservation.room_id);
                  
                console.log(`Room ${roomToUpdate.name} status updated to ${!isActive ? 'available' : 'occupied'}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error updating room status:", error);
      }
    };

    // Update room status on load and every minute
    updateRoomStatusBasedOnBookings();
    const intervalId = setInterval(updateRoomStatusBasedOnBookings, 60000);
    
    return () => clearInterval(intervalId);
  }, [rooms, user]);

  return {
    buildings,
    rooms,
    loading,
    selectedBuilding,
    setSelectedBuilding,
    handleToggleRoomAvailability
  };
}
