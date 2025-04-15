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
import { CalendarIcon, BarChart2, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface RoomUsageData {
  roomName: string;
  reservations: number;
  utilizationHours: number;
  status: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  
    const fetchRoomUsageData = async () => {
    setIsLoading(true);
    try {
      // Format dates for Supabase query
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // Get room reservation data
      const { data: reservationData, error: reservationError } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          rooms(name, type)
        `)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);

      if (reservationError) throw reservationError;

      // Get all rooms for complete data
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, type, status');

      if (roomsError) throw roomsError;

      // Process data for room usage chart
      const roomUsageMap = new Map<string, { roomName: string, reservations: number, utilizationHours: number, status: string }>();
      
      // Initialize map with all rooms
      roomsData.forEach(room => {
        roomUsageMap.set(room.id, {
          roomName: room.name,
          reservations: 0,
          utilizationHours: 0,
          status: room.status || 'available'
        });
      });

      // Process reservation data
      reservationData.forEach(reservation => {
        const roomId = reservation.room_id;
        const roomData = roomUsageMap.get(roomId);
        
        if (roomData) {
          // Parse times to calculate duration
          const startTime = reservation.start_time;
          const endTime = reservation.end_time;
          
          if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            // Calculate duration in hours
            const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
            
            roomUsageMap.set(roomId, {
              ...roomData,
              reservations: roomData.reservations + 1,
              utilizationHours: roomData.utilizationHours + durationHours
            });
          }
        }
      });

      // Convert map to array for chart
      const roomUsageArray = Array.from(roomUsageMap.values())
        .filter(room => room.roomName) // Filter out any rooms with undefined names
        .sort((a, b) => b.utilizationHours - a.utilizationHours) // Sort by utilization
        .slice(0, 10); // Get top 10 rooms

      setRoomUsageData(roomUsageArray);

      // Process room type data
      const roomTypeMap = new Map<string, number>();
      reservationData.forEach(reservation => {
        if (reservation.rooms && reservation.rooms.type) {
          const type = reservation.rooms.type;
          roomTypeMap.set(type, (roomTypeMap.get(type) || 0) + 1);
        }
      });

      const roomTypeArray = Array.from(roomTypeMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      setRoomTypeData(roomTypeArray);
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
  
  // Add status filter to the data processing
  const filteredRoomData = roomUsageData.filter(room => {
    if (statusFilter === "all") return true;
    return room.status === statusFilter;
  });

  // Initial data fetch
  useEffect(() => {
    fetchRoomUsageData();
  }, [startDate, endDate]);

  // Set up real-time subscription for room reservations
  useEffect(() => {
    const channel = supabase
      .channel('room-reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'room_reservations'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh data when any changes occur
          fetchRoomUsageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  // Preset date range options
  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setStartDate(startOfMonth(lastMonth));
    setEndDate(endOfMonth(lastMonth));
  };

  const setCurrentMonth = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={setCurrentMonth}>
            Current Month
          </Button>
          <Button variant="outline" size="sm" onClick={setLastMonth}>
            Last Month
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
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
          
          <Button 
            size="sm" 
            onClick={fetchRoomUsageData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="usage">
        <TabsList className="mb-4">
          <TabsTrigger value="usage" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Room Usage</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            <span>Room Types</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage">
          <div className="h-[400px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-center">
                  <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              </div>
            ) : filteredRoomData.length > 0 ? (
              <ChartContainer config={{
                utilizationHours: { label: "Hours", color: "#3b82f6" },
                reservations: { label: "Reservations", color: "#10b981" }
              }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={filteredRoomData}
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No room usage data available for the selected period.</p>
                  <p className="text-sm text-muted-foreground">Try selecting a different date range.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="types" className="h-[400px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : roomTypeData.length > 0 ? (
            <ChartContainer config={{
              value: { label: "Reservations", color: "#6366f1" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roomTypeData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Reservations" 
                    fill="var(--color-value)" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No room type data available for the selected period.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different date range.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
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
