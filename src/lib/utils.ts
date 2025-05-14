
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Room } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sorts rooms by their names in ascending order,
 * handling both numeric and alphanumeric room numbers correctly.
 */
export function sortRoomsByName(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    // Extract numeric parts from room names if possible
    const aNameNumeric = a.name.match(/^\d+/);
    const bNameNumeric = b.name.match(/^\d+/);
    
    // If both have numeric parts at the beginning
    if (aNameNumeric && bNameNumeric) {
      const aNum = parseInt(aNameNumeric[0]);
      const bNum = parseInt(bNameNumeric[0]);
      
      if (aNum !== bNum) {
        return aNum - bNum; // Sort numerically
      }
    }
    
    // Default to alphabetical sort
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}
