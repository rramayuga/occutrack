
import React, { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoomAnalyticsFilters from './RoomAnalyticsFilters';
import RoomUsageChart from './RoomUsageChart';
import RoomUsageCards from './RoomUsageCards';
import RoomAnalyticsHeader from './RoomAnalyticsHeader';
import { Card, CardContent } from "@/components/ui/card";
import { RoomUsageData } from '../types/room';

const RoomUsageStats: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [roomUsageData, setRoomUsageData] = useState<RoomUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

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

      const roomUsageMap = new Map<string, RoomUsageData>();
      
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

      let roomUsageArray = Array.from(roomUsageMap.values())
        .filter(room => {
          const buildingMatch = selectedBuilding === "all" || room.buildingName === selectedBuilding;
          const floorMatch = selectedFloor === "all" || room.floor === parseInt(selectedFloor);
          const statusMatch = statusFilter === "all" || room.status === statusFilter;
          return buildingMatch && floorMatch && statusMatch;
        })
        .sort((a, b) => {
          // Extract numbers from room names for natural sorting
          const aNum = parseInt(a.roomName.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.roomName.match(/\d+/)?.[0] || '0');
          return aNum - bNum;
        });

      setRoomUsageData(roomUsageArray);
      setCurrentPage(1); // Reset to first page when data changes
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

  const totalPages = Math.ceil(roomUsageData.length / 10);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-4">
      <RoomAnalyticsHeader
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(date) => date && setStartDate(date)}
        onEndDateChange={(date) => date && setEndDate(date)}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <RoomAnalyticsFilters
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          buildings={buildings}
          floors={getFloors()}
        />
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
          <RoomUsageChart data={roomUsageData} currentPage={currentPage} />
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * 10 + 1, roomUsageData.length)} - {Math.min(currentPage * 10, roomUsageData.length)} of {roomUsageData.length} rooms
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border flex items-center gap-1 text-sm disabled:opacity-50"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                ← Previous
              </button>
              <button
                className="px-3 py-1 rounded border flex items-center gap-1 text-sm disabled:opacity-50"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next →
                <span className="sr-only">Next</span>
              </button>
            </div>
          </div>
          
          <RoomUsageCards data={roomUsageData.slice((currentPage - 1) * 10, currentPage * 10)} />
        </div>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No room usage data available for the selected filters.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or selecting a different date range.</p>
          </div>
        </div>
      )}

      <Card>
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
