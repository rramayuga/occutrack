
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart2, PieChart, Building, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoomUsageData {
  roomName: string;
  reservations: number;
  utilizationHours: number;
  status: string;
  buildingName: string;
  floor: number;
}

interface RoomTypeData {
  name: string;
  value: number;
}

const RoomUsageStats = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [roomUsageData, setRoomUsageData] = useState<RoomUsageData[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<RoomTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();
  
  // Fetch buildings for the filter
  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name');
      
      if (!error && data) {
        setBuildings(data);
      }
    };
    
    fetchBuildings();
  }, []);
  
  const fetchRoomUsageData = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // Get room reservation data with building information
      const { data: reservationData, error: reservationError } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          rooms (
            id,
            name,
            type,
            status,
            floor,
            building_id,
            buildings (
              name
            )
          )
        `)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);

      if (reservationError) throw reservationError;

      // Get all rooms with building info for complete data
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          type,
          status,
          floor,
          building_id,
          buildings (
            name
          )
        `);

      if (roomsError) throw roomsError;

      // Process data for room usage chart
      const roomUsageMap = new Map<string, RoomUsageData>();
      
      // Initialize map with all rooms
      roomsData.forEach((room: any) => {
        roomUsageMap.set(room.id, {
          roomName: room.name,
          reservations: 0,
          utilizationHours: 0,
          status: room.status || 'available',
          buildingName: room.buildings?.name || 'Unknown',
          floor: room.floor
        });
      });

      // Process reservation data
      reservationData.forEach((reservation: any) => {
        const roomId = reservation.room_id;
        const roomData = roomUsageMap.get(roomId);
        
        if (roomData) {
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
            
            roomUsageMap.set(roomId, {
              ...roomData,
              reservations: roomData.reservations + 1,
              utilizationHours: roomData.utilizationHours + durationHours
            });
          }
        }
      });

      // Convert map to array and apply filters
      let roomUsageArray = Array.from(roomUsageMap.values())
        .filter(room => {
          const buildingMatch = selectedBuilding === "all" || room.buildingName === selectedBuilding;
          const floorMatch = selectedFloor === "all" || room.floor === parseInt(selectedFloor);
          const statusMatch = statusFilter === "all" || room.status === statusFilter;
          return buildingMatch && floorMatch && statusMatch;
        })
        .sort((a, b) => b.utilizationHours - a.utilizationHours);

      setRoomUsageData(roomUsageArray);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching room usage data:", error);
      toast({
        title: "Error",
        description: "Failed to load room usage data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for room reservations
  useEffect(() => {
    fetchRoomUsageData();
    
    const channel = supabase
      .channel('room-reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_reservations'
        },
        () => {
          fetchRoomUsageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate, selectedBuilding, selectedFloor, statusFilter]);

  const getFloors = () => {
    const floors = new Set<number>();
    roomUsageData.forEach(room => floors.add(room.floor));
    return Array.from(floors).sort((a, b) => a - b);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger>
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map(building => (
                <SelectItem key={building.id} value={building.name}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {getFloors().map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">From:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 w-[130px]"
              >
                <CalendarIcon className="h-4 w-4" />
                {format(startDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                disabled={(date) => date > endDate || date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">To:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 w-[130px]"
              >
                <CalendarIcon className="h-4 w-4" />
                {format(endDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                disabled={(date) => date < startDate || date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
      ) : roomUsageData.length > 0 ? (
        <div className="space-y-6">
          <div className="h-[400px] w-full">
            <ChartContainer config={{
              utilizationHours: { label: "Hours", color: "#3b82f6" },
              reservations: { label: "Reservations", color: "#10b981" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roomUsageData.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="roomName" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fontSize: 12 }}
                    height={70}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar 
                    dataKey="utilizationHours" 
                    name="Hours Used" 
                    yAxisId="left" 
                    fill="var(--color-utilizationHours)" 
                  />
                  <Bar 
                    dataKey="reservations" 
                    name="Total Reservations" 
                    yAxisId="right" 
                    fill="var(--color-reservations)" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {roomUsageData.map((room, index) => (
                <Card key={index} className="flex flex-col">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{room.roomName}</h4>
                        <p className="text-sm text-muted-foreground">{room.buildingName} - Floor {room.floor}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        room.status === 'available' ? 'bg-green-100 text-green-800' :
                        room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Usage Hours</p>
                        <p className="text-lg font-semibold">{room.utilizationHours.toFixed(1)}h</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Reservations</p>
                        <p className="text-lg font-semibold">{room.reservations}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No room usage data available for the selected filters.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or selecting a different date range.</p>
          </div>
        </div>
      )}

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
            <p>Data is updated in real-time as reservations change.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomUsageStats;
