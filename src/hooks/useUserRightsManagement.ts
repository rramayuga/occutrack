
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
      
      // If user is admin (and not superadmin), only show faculty and student users
      if (currentUser?.role === 'admin') {
        filteredUsers = filteredUsers.filter(user => 
          user.role === 'faculty' || user.role === 'student'
        );
      }

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
      
      // Check if the current user is admin and trying to set a role other than faculty or student
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
      
      // Wait a moment for the database update to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      }, 500);
      
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

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    filteredUsers,
    fetchUsers
  };
};
