
import React from 'react';
import { 
  Home, BookOpen, Building, Bell, 
  CalendarCheck, Users, FileText, Settings
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export const navLinks = [
  { 
    name: 'Home', 
    path: '/', 
    icon: React.createElement(Home, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] 
  },
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: React.createElement(BookOpen, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] 
  },
  { 
    name: 'Rooms', 
    path: '/rooms', 
    icon: React.createElement(Building, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] 
  },
  { 
    name: 'Announcements', 
    path: '/announcements', 
    icon: React.createElement(Bell, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] 
  },
];

export const adminLinks = [
  { 
    name: 'Room Management', 
    path: '/room-management', 
    icon: React.createElement(CalendarCheck, { size: 18 }), 
    roles: ['admin', 'superadmin'] 
  },
  { 
    name: 'Faculty Management', 
    path: '/faculty-management', 
    icon: React.createElement(Users, { size: 18 }), 
    roles: ['admin', 'superadmin'] 
  },
  { 
    name: 'Buildings & Types', 
    path: '/admin/buildings', 
    icon: React.createElement(Building, { size: 18 }), 
    roles: ['admin', 'superadmin'] 
  },
  { 
    name: 'Post Announcements', 
    path: '/admin/announcements', 
    icon: React.createElement(FileText, { size: 18 }), 
    roles: ['admin', 'superadmin'] 
  },
  { 
    name: 'System Settings', 
    path: '/admin/settings', 
    icon: React.createElement(Settings, { size: 18 }), 
    roles: ['superadmin'] 
  },
];
