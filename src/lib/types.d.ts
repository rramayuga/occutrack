export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Building {
  id: string;
  name: string;
  location: string;
  floors: number;
  createdAt: string;
  updatedAt: string;
  roomCount: number;
  utilization: number;
}

export interface BuildingWithFloors extends Building {
  floors: { id: string; name: string; number: number }[];
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  floor: number;
  buildingId: string;
  isAvailable: boolean;
  status: RoomStatus;
  occupiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReservationFormValues {
  roomId: string;
  roomNumber: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  roomNumber: string;
  building: string;
  date: string;
  startTime: string;
  endTime: string;
  displayStartTime?: string; // Added for AM/PM display format
  displayEndTime?: string; // Added for AM/PM display format
  purpose: string;
  status: string;
  faculty: string;
}
