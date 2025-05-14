import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates an Excel file with separate sheets for each building
 * @param buildingsData Map of building names to their room data arrays
 * @returns Blob object containing the Excel data
 */
export function createMultiSheetExcel(buildingsData: Map<string, any[]>): Blob {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Process each building and its rooms
  buildingsData.forEach((rooms, buildingName) => {
    // Clean building name for sheet name (Excel has restrictions on sheet names)
    const sheetName = buildingName.replace(/[*?:/\\[\]]/g, '').substring(0, 31);
    
    if (rooms.length === 0) {
      // Create an empty sheet with just headers
      const worksheet = XLSX.utils.aoa_to_sheet([['name', 'type', 'floor', 'capacity', 'status']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      return;
    }
    
    // Process room data - without buildingId and buildingName
    const roomsData = rooms.map(room => ({
      name: room.name,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity || '',
      status: room.status || 'available'
    }));
    
    // Create worksheet from the rooms data
    const worksheet = XLSX.utils.json_to_sheet(roomsData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  
  // Generate Excel file as array buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Convert to Blob
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parses an Excel file that contains room data with separate sheets for buildings
 * @param file The Excel file to parse
 * @returns Promise resolving to array of objects containing building name and room data
 */
export async function parseMultiSheetExcel(file: File): Promise<{ buildingName: string; rooms: any[] }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: { buildingName: string; rooms: any[] }[] = [];
        
        // Process each sheet in the workbook
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert sheet data to JSON
          const roomsData = XLSX.utils.sheet_to_json(worksheet);
          
          // Add building and its rooms to result
          result.push({
            buildingName: sheetName,
            rooms: roomsData
          });
        });
        
        resolve(result);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    
    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
  });
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
