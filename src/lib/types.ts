
// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin';

// Authentication types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Room and building types
export interface Room {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
  status?: 'available' | 'occupied' | 'maintenance'; // New field for more detailed status
  floor: number;
  buildingId: string;
  capacity?: number; // Make capacity optional to handle both new and old data
  occupiedBy?: string; // To store who occupies the room
}

export interface Building {
  id: string;
  name: string;
  location?: string;
  floors: number;
  roomCount: number;
  utilization?: string;
}

export interface BuildingWithFloors {
  id: string;
  name: string;
  floors: number[];
  roomCount: number;
  utilization?: string;
}

// Faculty types
export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  dateApplied: string;
}

// Reservation types
export interface Reservation {
  id: string;
  roomId: string;
  roomNumber: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  faculty: string;
}

export interface ReservationFormValues {
  building: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

// Announcement types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}
