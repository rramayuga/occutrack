
import { useState } from 'react';
import { Reservation } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export function useFetchActiveReservations() {
  const { user } = useAuth();

  // Fetch all current and upcoming reservations
  const fetchActiveReservations = async () => {
    if (!user) return [];
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('room_reservations')
        .select(`
          id,
          room_id,
          date,
          start_time,
          end_time,
          purpose,
          status,
          faculty_id
        `)
        .eq('faculty_id', user.id)
        .eq('date', today)
        .neq('status', 'completed')
        .order('start_time');
      
      if (error) throw error;
      
      if (data) {
        // Transform data to Reservation type
        return await enrichReservationsWithDetails(data);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching active reservations:", error);
      return [];
    }
  };

  // Add room and building details to reservations
  const enrichReservationsWithDetails = async (reservationData: any[]): Promise<Reservation[]> => {
    if (reservationData.length === 0) return [];
    
    try {
      // Get room information for all reservations
      const roomIds = reservationData.map(item => item.room_id);
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, building_id')
        .in('id', roomIds);
        
      if (roomsError) throw roomsError;
      
      // Get building information for all rooms
      const buildingIds = roomsData.map(room => room.building_id);
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, name')
        .in('id', buildingIds);
        
      if (buildingsError) throw buildingsError;
      
      // Create mappings for quick lookup
      const roomMap = Object.fromEntries(roomsData.map(room => [room.id, room]));
      const buildingMap = Object.fromEntries(buildingsData.map(building => [building.id, building.name]));
      
      // Transform the data
      return reservationData.map(item => {
        const room = roomMap[item.room_id] || { name: 'Unknown Room', building_id: null };
        const buildingName = room.building_id ? buildingMap[room.building_id] : 'Unknown Building';
        
        return {
          id: item.id,
          roomId: item.room_id,
          roomNumber: room.name,
          building: buildingName,
          date: item.date,
          startTime: item.start_time,
          endTime: item.end_time,
          purpose: item.purpose || '',
          status: item.status,
          faculty: user?.name || ''
        };
      });
    } catch (error) {
      console.error("Error enriching reservations:", error);
      return [];
    }
  };

  return { fetchActiveReservations };
}
