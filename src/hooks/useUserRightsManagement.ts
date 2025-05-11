
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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

  const exportUsers = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Role'];
    const csvRows = [headers.join(',')];
    
    filteredUsers.forEach((user) => {
      const row = [
        user.name,
        user.email,
        user.role
      ].join(',');
      csvRows.push(row);
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `user-roles-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: 'User roles have been exported to CSV',
    });
  };

  const handleBulkRoleChange = async (newRole: UserRole) => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to update their roles',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check permissions for admins
      if (currentUser?.role === 'admin' && 
          newRole !== 'faculty' && newRole !== 'student') {
        toast({
          title: 'Permission Denied',
          description: 'Admin users can only assign faculty or student roles',
          variant: 'destructive'
        });
        return;
      }

      // Update roles in the database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .in('id', selectedUsers);
        
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          selectedUsers.includes(user.id) ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: 'Roles updated',
        description: `Updated ${selectedUsers.length} user(s) to ${newRole} role`,
      });
      
      // Clear selection
      setSelectedUsers([]);
      
      // Refetch users
      setTimeout(fetchUsers, 1000);
      
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user roles',
        variant: 'destructive'
      });
      fetchUsers();
    }
  };

  const handleDeleteRoles = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to delete their roles',
        variant: 'destructive'
      });
      return;
    }

    try {
      // For demonstration, we'll set them to 'student' as a default role
      // In a real app, you might want to handle this differently
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'student' })
        .in('id', selectedUsers);
        
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          selectedUsers.includes(user.id) ? { ...user, role: 'student' } : user
        )
      );
      
      toast({
        title: 'Roles reset',
        description: `Reset ${selectedUsers.length} user(s) to student role`,
      });
      
      // Clear selection
      setSelectedUsers([]);
      
      // Refetch users
      setTimeout(fetchUsers, 1000);
      
    } catch (error) {
      console.error('Error resetting user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset user roles',
        variant: 'destructive'
      });
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

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

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
    exportUsers,
    handleBulkRoleChange,
    handleDeleteRoles,
    selectedUsers,
    toggleUserSelection,
    selectAllVisible,
    clearSelection
  };
};
