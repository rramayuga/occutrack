
import React from 'react';
import { 
  Home, BookOpen, Building, Bell, 
  CalendarCheck, Users, FileText, Shield
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export const navLinks = [
  { 
    name: 'Home', 
    path: '/', 
    icon: React.createElement(Home, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] as UserRole[] 
  },
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: React.createElement(BookOpen, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] as UserRole[] 
  },
  { 
    name: 'Rooms', 
    path: '/rooms', 
    icon: React.createElement(Building, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] as UserRole[] 
  },
  { 
    name: 'Announcements', 
    path: '/announcements', 
    icon: React.createElement(Bell, { size: 18 }), 
    roles: ['student', 'faculty', 'admin', 'superadmin'] as UserRole[] 
  },
];

export const adminLinks = [
  { 
    name: 'Room Management', 
    path: '/room-management', 
    icon: React.createElement(CalendarCheck, { size: 18 }), 
    roles: ['admin', 'superadmin'] as UserRole[] 
  },
  { 
    name: 'Faculty Management', 
    path: '/faculty-management', 
    icon: React.createElement(Users, { size: 18 }), 
    roles: ['admin'] as UserRole[] 
  },
  { 
    name: 'User Rights', 
    path: '/user-rights', 
    icon: React.createElement(Shield, { size: 18 }), 
    roles: ['admin', 'superadmin'] as UserRole[] 
  },
  { 
    name: 'Post Announcements', 
    path: '/admin/announcements', 
    icon: React.createElement(FileText, { size: 18 }), 
    roles: ['admin', 'superadmin'] as UserRole[] 
  },
];
