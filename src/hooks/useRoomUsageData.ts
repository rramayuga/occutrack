
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomUsageData } from '@/components/admin/types/room';

export function useRoomUsageData(
  startDate?: Date,
  endDate?: Date,
  selectedBuilding?: string,
  selectedFloor?: string,
  statusFilter?: string
) {
  const [roomUsageData, setRoomUsageData] = useState<RoomUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomUsageData = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would fetch usage data from the database
        // For now, we'll create some sample data
        const sampleData: RoomUsageData[] = [
          {
            roomId: '1',
            roomName: 'Room 101',
            roomType: 'Classroom',
            buildingName: 'Engineering Building',
            floor: 1,
            status: 'available',
            reservations: 12,
            utilizationHours: 24,
            utilizationRate: 0.45
          },
          {
            roomId: '2',
            roomName: 'Room 202',
            roomType: 'Laboratory',
            buildingName: 'Science Building',
            floor: 2,
            status: 'occupied',
            reservations: 18,
            utilizationHours: 36,
            utilizationRate: 0.70
          },
          {
            roomId: '3',
            roomName: 'Room 305',
            roomType: 'Lecture Hall',
            buildingName: 'Humanities Building',
            floor: 3,
            status: 'available',
            reservations: 8,
            utilizationHours: 16,
            utilizationRate: 0.30
          },
          {
            roomId: '4',
            roomName: 'Room 405',
            roomType: 'Classroom',
            buildingName: 'Engineering Building',
            floor: 4,
            status: 'maintenance',
            reservations: 5,
            utilizationHours: 10,
            utilizationRate: 0.20
          },
          {
            roomId: '5',
            roomName: 'Room 501',
            roomType: 'Conference',
            buildingName: 'Admin Building',
            floor: 5,
            status: 'available',
            reservations: 22,
            utilizationHours: 44,
            utilizationRate: 0.85
          }
        ];
        
        setRoomUsageData(sampleData);
      } catch (error) {
        console.error("Error fetching room usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomUsageData();
  }, [startDate, endDate, selectedBuilding, selectedFloor, statusFilter]); // Added dependencies for the parameters

  return { roomUsageData, loading };
}
