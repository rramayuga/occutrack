
import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';

export const useUserRightsManagement = (shouldFetch: boolean = false) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      // Get all users from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar');
      
      if (error) throw error;
      
      // Separately get all rejected faculty users
      const { data: rejectedFaculty, error: rejectionError } = await supabase
        .from('faculty_requests')
        .select('user_id')
        .eq('status', 'rejected');
      
      if (rejectionError) throw rejectionError;
      
      // Create a set of rejected user IDs for faster lookup
      const rejectedUserIds = new Set(
        rejectedFaculty ? rejectedFaculty.map(item => item.user_id) : []
      );
      
      // Filter out users who have been rejected
      let filteredUsers = profiles
        ? profiles
            .filter(profile => !rejectedUserIds.has(profile.id))
            .map(profile => ({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              avatarUrl: profile.avatar
            }))
        : [];
      
      // If user is admin (but not superadmin), only show faculty and student users
      if (currentUser?.role === 'admin') {
        filteredUsers = filteredUsers.filter(user => 
          user.role === 'faculty' || user.role === 'student'
        );
      }
      // SuperAdmin can manage all users

      console.log('Fetched users:', filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentUser]);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      console.log(`Updating role for user ${userId} to ${newRole}`);
      
      // Check if the current user is admin (not superadmin) and trying to set a role other than faculty or student
      if (currentUser?.role === 'admin' && 
          newRole !== 'faculty' && newRole !== 'student') {
        toast({
          title: 'Permission Denied',
          description: 'Admin users can only assign faculty or student roles',
          variant: 'destructive'
        });
        return;
      }
      
      // Update the database first before updating local state
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) {
        console.error('Database error when updating role:', error);
        throw error;
      }
      
      // Update the local state after successful database update
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });
      
      // Refetch users to ensure we have the most current data
      setTimeout(() => {
        fetchUsers();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
      
      // Make sure we have the latest data after an error
      fetchUsers();
    }
  };
  
  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    try {
      // First check if we can delete this user (can't delete ourselves or superadmins if we're just admin)
      if (userId === currentUser?.id) {
        toast({
          title: 'Cannot Delete',
          description: 'You cannot delete your own account',
          variant: 'destructive'
        });
        return false;
      }
      
      const userToDelete = users.find(u => u.id === userId);
      
      // Check admin permissions - admin cannot delete other admins or superadmins
      if (currentUser?.role === 'admin' && userToDelete && 
         (userToDelete.role === 'admin' || userToDelete.role === 'superadmin')) {
        toast({
          title: 'Permission Denied',
          description: 'Admin users cannot delete admin or superadmin accounts',
          variant: 'destructive'
        });
        return false;
      }
      
      // Delete all related records first (reservations, faculty requests, etc)
      // This prevents foreign key constraint issues
      
      // 1. Delete room reservations made by this user
      const { error: reservationError } = await supabase
        .from('room_reservations')
        .delete()
        .eq('faculty_id', userId);
        
      if (reservationError) {
        console.error("Error deleting user's reservations:", reservationError);
        // Continue anyway - we'll try to delete the profile
      }
      
      // 2. Delete faculty requests made by this user
      const { error: facultyError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('user_id', userId);
        
      if (facultyError) {
        console.error("Error deleting user's faculty requests:", facultyError);
        // Continue anyway
      }
      
      // 3. Delete room_availability records made by this user
      const { error: availabilityError } = await supabase
        .from('room_availability')
        .delete()
        .eq('updated_by', userId);
        
      if (availabilityError) {
        console.error("Error deleting user's room availability records:", availabilityError);
        // Continue anyway
      }
      
      // 4. Delete announcements made by this user
      const { error: announcementError } = await supabase
        .from('announcements')
        .delete()
        .eq('created_by', userId);
        
      if (announcementError) {
        console.error("Error deleting user's announcements:", announcementError);
        // Continue anyway
      }
      
      // Finally delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) {
        console.error("Error deleting user profile:", profileError);
        throw profileError;
      }
      
      // Update our local state to remove the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: 'User Deleted',
        description: 'User account has been successfully deleted',
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: 'Error',
        description: 'Failed to delete user account',
        variant: 'destructive'
      });
      return false;
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    if (shouldFetch) {
      fetchUsers();
    }
  }, [shouldFetch, fetchUsers]);

  // Set up a subscription to profile changes
  useEffect(() => {
    if (shouldFetch) {
      const profilesChannel = supabase
        .channel('profiles-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles' }, 
            (payload) => {
              console.log('Profile changes detected:', payload);
              fetchUsers();
            })
        .subscribe();
            
      return () => {
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [shouldFetch, fetchUsers]);

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    filteredUsers,
    fetchUsers,
    handleDeleteUser
  };
};
