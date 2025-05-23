
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
      applyFilters(filteredUsers, searchTerm, roleFilter);
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
  }, [searchTerm, roleFilter, toast, currentUser]);
  
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
      
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
      
      // Make sure we have the latest data after an error
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Check if current user is trying to delete themselves
      if (currentUser?.id === userId) {
        toast({
          title: 'Error',
          description: 'You cannot delete your own account',
          variant: 'destructive'
        });
        return;
      }

      // Only superadmin can delete users
      if (currentUser?.role !== 'superadmin') {
        toast({
          title: 'Permission Denied',
          description: 'Only super administrators can delete user accounts',
          variant: 'destructive'
        });
        return;
      }

      console.log('Attempting to delete user:', userId);
      
      // First delete from auth.users using direct table deletion instead of RPC
      // Delete any faculty requests first
      const { error: facultyRequestError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('user_id', userId);
        
      if (facultyRequestError) {
        console.error('Error deleting faculty request:', facultyRequestError);
        // Continue with profile deletion even if faculty request deletion fails
      }
      
      // Delete the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw profileError;
      }
      
      // Update the local state by removing the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: 'User deleted',
        description: 'User account has been permanently deleted from the system',
      });
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user account. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const applyFilters = (
    userList: User[],
    search: string,
    role: UserRole | 'all'
  ) => {
    // Filter by search query
    let filtered = [...userList];
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    // Filter by role
    if (role !== 'all') {
      filtered = filtered.filter(user => user.role === role);
    }
    
    setFilteredUsers(filtered);
  };

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (shouldFetch) {
      fetchUsers();
    }
  }, [shouldFetch, fetchUsers]);

  // Apply filters whenever users, searchTerm, or roleFilter changes
  useEffect(() => {
    applyFilters(users, searchTerm, roleFilter);
  }, [users, searchTerm, roleFilter]);

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
    handleDeleteUser,
    filteredUsers,
    fetchUsers
  };
};
