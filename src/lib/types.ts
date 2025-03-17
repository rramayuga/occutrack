
export type UserRole = "student" | "professor" | "admin" | "superadmin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileComplete: boolean;
  avatar?: string;
  department?: string;
  studentId?: string;
  facultyId?: string;
}

export interface Room {
  id: string;
  name: string;
  buildingId: string;
  capacity: number;
  type: string;
  features: string[];
  currentOccupancy: number;
  isAvailable: boolean;
  image?: string;
}

export interface Building {
  id: string;
  name: string;
  location: string;
  floors: number;
  roomCount: number;
  image?: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  defaultCapacity: number;
  features: string[];
}

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  tags: string[];
}

export interface CheckInRecord {
  id: string;
  userId: string;
  roomId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: "active" | "completed";
}

export interface NavigationLink {
  name: string;
  path: string;
  icon?: React.ReactNode;
  roles: UserRole[];
}
