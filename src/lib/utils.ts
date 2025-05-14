
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a multi-sheet CSV file with separate sections for each building
 * @param buildingsData Map of building names to their room data arrays
 * @returns Blob object containing the CSV data
 */
export function createMultiSheetCsv(buildingsData: Map<string, any[]>): Blob {
  let csvContent = '';
  
  // Process each building and its rooms
  buildingsData.forEach((rooms, buildingName) => {
    // Add building section header
    csvContent += `### BUILDING: ${buildingName} ###\n`;
    
    if (rooms.length === 0) {
      csvContent += 'No rooms for this building\n\n';
      return;
    }
    
    // Create CSV header row - without buildingId and buildingName
    csvContent += 'name,type,floor,capacity,status\n';
    
    // Add room data rows
    rooms.forEach(room => {
      const rowData = [
        room.name,
        room.type,
        room.floor,
        room.capacity || '',
        room.status || 'available'
      ];
      
      csvContent += rowData.join(',') + '\n';
    });
    
    // Add separator between buildings
    csvContent += '\n';
  });
  
  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Parses a multi-sheet CSV file that contains room data separated by buildings
 * @param text The raw CSV text content
 * @returns Array of objects containing building name and room data
 */
export function parseMultiSheetCsv(text: string): { buildingName: string; rooms: any[] }[] {
  const result: { buildingName: string; rooms: any[] }[] = [];
  let currentBuildingName = '';
  let currentBuildingRooms: any[] = [];
  let isReadingHeaders = false;
  let headers: string[] = [];
  
  // Split text into lines
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for building header
    if (line.startsWith('### BUILDING:')) {
      // Save previous building data if exists
      if (currentBuildingName && currentBuildingRooms.length > 0) {
        result.push({
          buildingName: currentBuildingName,
          rooms: currentBuildingRooms
        });
      }
      
      // Extract new building name
      currentBuildingName = line.replace('### BUILDING:', '').replace('###', '').trim();
      currentBuildingRooms = [];
      isReadingHeaders = true;
      continue;
    }
    
    // Skip "No rooms" message
    if (line === 'No rooms for this building') continue;
    
    // Process header row
    if (isReadingHeaders) {
      headers = line.split(',').map(header => header.trim());
      isReadingHeaders = false;
      continue;
    }
    
    // Process data rows
    const values = line.split(',').map(value => value.trim());
    if (values.length !== headers.length) continue; // Skip invalid rows
    
    // Create room object
    const roomData: any = {};
    headers.forEach((header, index) => {
      roomData[header] = values[index];
    });
    
    currentBuildingRooms.push(roomData);
  }
  
  // Add the last building if not already added
  if (currentBuildingName && currentBuildingRooms.length > 0) {
    result.push({
      buildingName: currentBuildingName,
      rooms: currentBuildingRooms
    });
  }
  
  return result;
}
