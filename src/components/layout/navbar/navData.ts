
import { 
  Home, BookOpen, Building, Bell, 
  CalendarCheck, Users, FileText, Settings
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export const navLinks = [
  { name: 'Home', path: '/', icon: <Home size={18} />, roles: ['student', 'faculty', 'admin', 'superadmin'] },
  { name: 'Dashboard', path: '/dashboard', icon: <BookOpen size={18} />, roles: ['student', 'faculty', 'admin', 'superadmin'] },
  { name: 'Rooms', path: '/rooms', icon: <Building size={18} />, roles: ['student', 'faculty', 'admin', 'superadmin'] },
  { name: 'Announcements', path: '/announcements', icon: <Bell size={18} />, roles: ['student', 'faculty', 'admin', 'superadmin'] },
];

export const adminLinks = [
  { name: 'Room Management', path: '/room-management', icon: <CalendarCheck size={18} />, roles: ['admin', 'superadmin'] },
  { name: 'Faculty Management', path: '/faculty-management', icon: <Users size={18} />, roles: ['admin', 'superadmin'] },
  { name: 'Buildings & Types', path: '/admin/buildings', icon: <Building size={18} />, roles: ['admin', 'superadmin'] },
  { name: 'Post Announcements', path: '/admin/announcements', icon: <FileText size={18} />, roles: ['admin', 'superadmin'] },
  { name: 'System Settings', path: '/admin/settings', icon: <Settings size={18} />, roles: ['superadmin'] },
];
