
import { Home, Users, Building, ShieldCheck, BookOpen, MessageSquare } from 'lucide-react';

export const navLinks = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: Home,
    roles: ['student', 'faculty', 'admin', 'superadmin']
  },
  {
    path: '/rooms',
    name: 'Rooms',
    icon: Building,
    roles: ['student', 'faculty', 'admin', 'superadmin']
  },
  {
    path: '/announcements',
    name: 'Announcements',
    icon: MessageSquare,
    roles: ['student', 'faculty', 'admin', 'superadmin']
  }
];

export const adminLinks = [
  {
    path: '/room-management',
    name: 'Room Management',
    icon: Building,
    roles: ['admin', 'superadmin']
  },
  {
    path: '/user-management',
    name: 'User Management',
    icon: Users,
    roles: ['admin', 'superadmin']
  },
  {
    path: '/user-rights',
    name: 'User Rights',
    icon: ShieldCheck,
    roles: ['superadmin']
  },
  {
    path: '/admin/announcements',
    name: 'Announcements Manager',
    icon: MessageSquare,
    roles: ['admin', 'superadmin']
  }
];
