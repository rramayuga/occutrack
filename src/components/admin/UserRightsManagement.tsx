
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserRightsManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserRightsManagement: React.FC<UserRightsManagementDialogProps> = ({ open, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);
  
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
            // Only exclude profiles that have a faculty_requests entry with status = 'rejected'
            const facultyRequestStatus = profile.faculty_requests?.[0]?.status;
            return facultyRequestStatus !== 'rejected';
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
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage User Rights</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-4 my-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select 
            value={roleFilter} 
            onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <ScrollArea className="flex-1 border rounded-md">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="min-w-full">
              <div className="grid grid-cols-3 font-medium p-3 border-b">
                <div>User</div>
                <div>Email</div>
                <div>Role</div>
              </div>
              {filteredUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-3 p-3 border-b items-center">
                  <div>{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div>
                    <Select 
                      defaultValue={user.role} 
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRightsManagement;
