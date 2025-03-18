// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

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
  capacity: number;
  type: string;
  isAvailable: boolean;
  floor: number;
  buildingId: string;
}

export interface Building {
  id: string;
  name: string;
  location?: string;
  floors: number;
  roomCount: number;
}

export interface BuildingWithFloors {
  id: string;
  name: string;
  floors: number[];
  roomCount: number;
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
