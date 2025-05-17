import { useEffect, useRef, useCallback } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useReservationStatusManager } from './reservation/useReservationStatusManager';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRoomReservationCheck(rooms: Room[], updateRoomAvailability: (roomId: string, isAvailable: boolean, status: RoomStatus) => void) {
  const { user } = useAuth();
  const { activeReservations, processReservations } = useReservationStatusManager();
  const { toast } = useToast();
  
  // Enhanced tracking system with last check time and per-room status processing timestamps
  const lastCheckTime = useRef<Date>(new Date());
  const isProcessing = useRef<boolean>(false);
  // Track room status by reservation to prevent redundant updates
  const processedRoomStatuses = useRef<Map<string, {
    status: string, 
    timestamp: number, 
    processed: boolean,
    reservationId: string
  }>>(new Map());
  
  // Compare times in HH:MM format with better precision
  const compareTimeStrings = useCallback((time1: string, time2: string): number => {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    // Convert to minutes for better comparison
    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;
    
    return totalMinutes1 - totalMinutes2;
  }, []);

  // Format current time as HH:MM for consistent comparison
  const getCurrentTimeString = useCallback(() => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + 
           now.getMinutes().toString().padStart(2, '0');
  }, []);

  // Get today's date in YYYY-MM-DD format for consistent comparison
  const getCurrentDateString = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  
  // Set up real-time subscription for reservation changes - maintain this logic
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up real-time subscription for room reservations");
    
    const channel = supabase
      .channel('room-status-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'room_reservations' 
        }, 
        (payload) => {
          console.log("Reservation change detected via realtime:", payload);
          // Only process if we're not already processing
          if (!isProcessing.current) {
            setTimeout(() => processReservations(), 2000);
          }
        })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, processReservations]);
  
  // Effect for processing room status changes based on reservations - with optimized checks
  useEffect(() => {
    if (!user || activeReservations.length === 0 || isProcessing.current) return;
    
    // Increase check interval to reduce frequency 
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastCheckTime.current.getTime();
    if (timeSinceLastCheck < 30000) return; // 30 seconds between global checks
    
    lastCheckTime.current = now;
    isProcessing.current = true;
    
    const updateRoomStatusBasedOnReservations = async () => {
      try {
        const currentDate = getCurrentDateString();
        const currentTime = getCurrentTimeString();
        
        console.log(`Checking room statuses at ${currentDate} ${currentTime}`);
        
        // Track which rooms we've processed to avoid redundant updates
        const processedRooms = new Set<string>();
        
        // Process today's active reservations
        const todayReservations = activeReservations.filter(r => r.date === currentDate);
        
        for (const reservation of todayReservations) {
          // Skip if we've already processed this room in this check cycle
          if (processedRooms.has(reservation.roomId)) continue;
          
          // Find the room
          const roomToUpdate = rooms.find(r => r.id === reservation.roomId);
          if (!roomToUpdate) continue;
          
          // Skip rooms under maintenance
          if (roomToUpdate.status === 'maintenance') continue;
          
          processedRooms.add(reservation.roomId);
          
          const startTime = reservation.startTime;
          const endTime = reservation.endTime;
          
          // More precise time comparison
          const isActive = compareTimeStrings(currentTime, startTime) >= 0 && 
                          compareTimeStrings(currentTime, endTime) < 0;
                          
          const hasEnded = compareTimeStrings(currentTime, endTime) >= 0;
          
          // Generate a unique key for this room+reservation status
          const roomStatusKey = `${reservation.roomId}-${reservation.id}-${isActive ? 'active' : 'ended'}`;
          const lastProcessed = processedRoomStatuses.current.get(roomStatusKey);
          const currentTimestamp = Date.now();
          
          // Only update status if:
          // 1. There's a status change needed (active → occupied or ended → available)
          // 2. We haven't processed this exact status recently
          
          // Case: Room should be OCCUPIED but currently isn't
          if (isActive && roomToUpdate.status !== 'occupied') {
            // Check if we've already tried this recently - much longer cooldown 
            if (lastProcessed && 
                (currentTimestamp - lastProcessed.timestamp) < 300000) { // 5 minute cooldown
              console.log(`Skipping status update for ${roomToUpdate.name} to OCCUPIED - processed recently`);
              continue;
            }
            
            console.log(`Setting room ${roomToUpdate.name} to OCCUPIED (current time ${currentTime} is between ${startTime} and ${endTime})`);
            updateRoomAvailability(reservation.roomId, false, 'occupied');
            
            // Record this update in our tracker
            processedRoomStatuses.current.set(roomStatusKey, { 
              status: 'occupied', 
              timestamp: currentTimestamp,
              processed: true,
              reservationId: reservation.id
            });
          } 
          // Case: Room should be AVAILABLE but is currently OCCUPIED
          else if (hasEnded && roomToUpdate.status === 'occupied') {
            console.log(`Setting room ${roomToUpdate.name} to AVAILABLE (current time ${currentTime} is after end time ${endTime})`);
            updateRoomAvailability(reservation.roomId, true, 'available');
            
            // Record this update in our tracker
            processedRoomStatuses.current.set(roomStatusKey, { 
              status: 'available', 
              timestamp: currentTimestamp,
              processed: true,
              reservationId: reservation.id
            });
          }
          // Case: Room status already matches what it should be
          else {
            // If status already correct, mark as processed so we don't keep checking
            if (!lastProcessed) {
              processedRoomStatuses.current.set(roomStatusKey, {
                status: roomToUpdate.status,
                timestamp: currentTimestamp,
                processed: true,
                reservationId: reservation.id
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating room status based on reservations:", error);
      } finally {
        isProcessing.current = false;
      }
    };

    // Run the update function
    updateRoomStatusBasedOnReservations();
    
  }, [user, rooms, activeReservations, updateRoomAvailability, processReservations, compareTimeStrings, getCurrentDateString, getCurrentTimeString]);

  return null;
}
