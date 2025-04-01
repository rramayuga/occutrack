
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useUserRightsManagement = (isDialogOpen: boolean) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (isDialogOpen) {
      fetchUsers();
    }
  }, [isDialogOpen]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Filter out users with rejected faculty status by joining with faculty_requests table
      const { data: profilesWithRejectedStatus, error: joinError } = await supabase
        .from('profiles')
        .select(`
          id, 
          name,
          email,
          role,
          avatar,
          faculty_requests!left (
            status
          )
        `)
        .order('role');
      
      if (joinError) throw joinError;
      
      // Filter out users who have a rejected faculty status
      const filteredUsers = profilesWithRejectedStatus
        ? profilesWithRejectedStatus.filter(profile => {
            // Only include profiles that don't have a faculty_requests entry with status = 'rejected'
            const facultyRequests = profile.faculty_requests;
            if (!facultyRequests || facultyRequests.length === 0) return true;
            
            // If any faculty request is rejected, exclude this user
            return !facultyRequests.some((request: any) => request.status === 'rejected');
          }).map(profile => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar
          }))
        : [];

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
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
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
    filteredUsers
  };
};
