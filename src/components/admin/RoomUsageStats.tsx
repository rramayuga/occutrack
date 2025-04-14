
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RoomUsageData {
  roomName: string;
  reservations: number;
  utilizationHours: number;
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

  useEffect(() => {
    fetchRoomUsageData();
  }, [startDate, endDate]);

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
        .select('id, name, type');

      if (roomsError) throw roomsError;

      // Process data for room usage chart
      const roomUsageMap = new Map<string, { roomName: string, reservations: number, utilizationHours: number }>();
      
      // Initialize map with all rooms
      roomsData.forEach(room => {
        roomUsageMap.set(room.id, {
          roomName: room.name,
          reservations: 0,
          utilizationHours: 0
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
    } catch (error) {
      console.error("Error fetching room usage data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Room Usage Analytics</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
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
                  className="p-3 pointer-events-auto"
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
                  className="flex items-center gap-2"
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usage">
          <TabsList className="mb-4">
            <TabsTrigger value="usage">Room Usage</TabsTrigger>
            <TabsTrigger value="types">Room Types</TabsTrigger>
          </TabsList>
          <TabsContent value="usage" className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : roomUsageData.length > 0 ? (
              <ChartContainer config={{
                utilizationHours: { label: "Hours", color: "#3b82f6" },
                reservations: { label: "Reservations", color: "#10b981" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roomUsageData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 70 }}
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
                <p className="text-muted-foreground">No room usage data available for the selected period.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="types" className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading data...</p>
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
                <p className="text-muted-foreground">No room type data available for the selected period.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoomUsageStats;
