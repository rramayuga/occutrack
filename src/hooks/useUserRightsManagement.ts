
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useUserRightsManagement = (shouldFetch: boolean = false) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (shouldFetch) {
      fetchUsers();
    }
  }, [shouldFetch]);
  
  const fetchUsers = async () => {
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
      const filteredUsers = profiles
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
  };
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      console.log(`Updating role for user ${userId} to ${newRole}`);
      
      // First update the local state immediately for better UI responsiveness
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      // Then update the database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) {
        console.error('Database error when updating role:', error);
        // Revert the local state change if there's an error
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, role: user.role } : user
          )
        );
        throw error;
      }
      
      // Verify the update by fetching the user again
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (verifyError) {
        console.error('Error verifying role update:', verifyError);
      } else {
        console.log('Verified role after update:', verifyData.role);
        
        // If the role in the database doesn't match what we expect, refetch all users
        if (verifyData.role !== newRole) {
          console.warn('Role verification failed: database shows', verifyData.role, 'but we expected', newRole);
          await fetchUsers(); // Refetch all users to get the correct data
        } else {
          console.log('Role updated successfully in the database');
        }
      }
      
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });
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
