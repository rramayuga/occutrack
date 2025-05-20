
import { useRef, useEffect, useCallback, useState } from 'react';
import { useReservationStatusManager } from './reservation/useReservationStatusManager';
import { useToast } from "@/hooks/use-toast";

export function useReservationTimeTracker() {
  // This hook is a wrapper around our centralized status manager
  // to maintain backward compatibility with existing components
  const { 
    activeReservations,
    completedReservationIds, 
    fetchActiveReservations,
    processReservations,
    connectionError: managerConnectionError
  } = useReservationStatusManager();
  
  // Track if we've already processed reservations this render cycle
  // and when the last processing happened
  const processedThisRender = useRef(false);
  const lastProcessTime = useRef(Date.now());
  const [connectionError, setConnectionError] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 8; // Increase max retries
  const { toast } = useToast();
  
  // Process reservations on a fixed interval and update the UI accordingly
  const processAndUpdate = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastProcessTime.current > 5000) { // 5 seconds between checks for faster updates
        console.log("Processing reservations in useReservationTimeTracker");
        await processReservations();
        lastProcessTime.current = now;
        
        // Clear any previous connection error state if successful
        if (connectionError) {
          setConnectionError(false);
          retryCount.current = 0;
        }
      }
    } catch (error) {
      console.error("Error in processAndUpdate:", error);
      setConnectionError(true);
      
      // If we're getting too many failures, show a toast to inform the user
      if (retryCount.current === 3) {
        toast({
          title: "Connection Issues",
          description: "Having trouble connecting to the reservation system. Will continue trying...",
          variant: "destructive",
        });
      }
      
      retryCount.current += 1;
      
      // If we have connection errors, we'll try again with exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount.current - 1), 30000);
      console.log(`Will retry after ${backoffDelay}ms (attempt ${retryCount.current})`);
      
      // Try to recover by forcing a new fetch after a delay
      if (retryCount.current <= maxRetries) {
        setTimeout(() => {
          fetchActiveReservations().catch(e => {
            console.error("Error during retry fetch:", e);
          });
        }, backoffDelay);
      }
    }
  }, [processReservations, connectionError, fetchActiveReservations, toast]);
  
  // Set up an effect to process reservations on mount and at regular intervals
  useEffect(() => {
    console.log("Setting up reservation tracking in useReservationTimeTracker");
    
    // Initial processing - wrapped in try/catch for resilience
    const initialSetup = async () => {
      try {
        await fetchActiveReservations();
        await processAndUpdate();
      } catch (error) {
        console.error("Error during initial reservation setup:", error);
        setConnectionError(true);
        // Don't increment retry count for initial setup to allow more immediate retries
      }
    };
    
    initialSetup();
    
    // Set up a more frequent interval for better responsiveness
    const intervalId = setInterval(() => {
      processAndUpdate();
    }, 5000); // Check every 5 seconds for more responsive status updates
    
    return () => clearInterval(intervalId);
  }, [fetchActiveReservations, processAndUpdate]);

  // Sync our local connection error state with the manager's
  useEffect(() => {
    setConnectionError(managerConnectionError || connectionError);
  }, [managerConnectionError]);

  return {
    activeReservations,
    completedReservations: completedReservationIds,
    fetchActiveReservations,
    processReservations,
    connectionError: connectionError || managerConnectionError
  };
}
