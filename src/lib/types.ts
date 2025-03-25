
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin';

export interface Building {
  id: string;
  name: string;
  location?: string;
  floors?: number;
  createdAt?: string;
  updatedAt?: string;
  roomCount?: number;
  utilization?: string;
}

// Changed to not extend Building since floors has a different type
export interface BuildingWithFloors {
  id: string;
  name: string;
  location?: string;
  floors: number[];
  createdAt?: string;
  updatedAt?: string;
  roomCount?: number;
  utilization?: string;
}

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
  date: string;  // Changed from Date to string
  startTime: string;
  endTime: string;
  purpose: string;
  roomNumber?: string;  // Added these optional properties 
  building?: string;    // to match usage in the code
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Room {
  id: string;
  name: string;
  type: string;
  floor: number;
  buildingId: string;
  isAvailable: boolean;
  capacity?: number;
  status?: RoomStatus;
  occupiedBy?: string | null;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user_id?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy?: string;
}
