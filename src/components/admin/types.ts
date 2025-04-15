
import React from 'react';

export interface RoomAnalyticsFilters {
  selectedBuilding: string;
  selectedFloor: number | null;
  statusFilter: string;
  buildings: {
    id: string;
    name: string;
  }[];
  floors: number[];
}

export interface AnalyticsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export interface FilterChangeHandler {
  onBuildingChange: (buildingId: string) => void;
  onFloorChange: (floor: number | null) => void;
  onStatusChange: (status: string) => void;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user_id: string;
}

export interface BuildingFormValues {
  name: string;
  floorCount: number;
  location?: string;
}

export interface RoomFormValues {
  name: string;
  type: string;
  floor: number;
  buildingId: string;
  isAvailable: boolean;
}
