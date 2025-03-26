
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, UserPlus, UserCheck, UserMinus, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserRightsManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const UserRightsManagement: React.FC<UserRightsManagementProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole | ''>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedData: UserWithRole[] = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          role: item.role as UserRole,
          createdAt: item.created_at,
        }));
        
        setUsers(transformedData);
        setFilteredUsers(transformedData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Could not load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...users];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleUpdateRole = async (user: UserWithRole, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Role Updated',
        description: `${user.name}'s role updated to ${role}`,
      });
      
      setUsers(prev => 
        prev.map(u => 
          u.id === user.id ? { ...u, role } : u
        )
      );
      
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500';
      case 'superadmin':
        return 'bg-red-500';
      case 'faculty':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return <Shield className="h-4 w-4" />;
      case 'faculty':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Rights Management
          </DialogTitle>
          <DialogDescription>
            Manage user roles and permissions for your application
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="superadmin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-10">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Select
                            value={selectedUser?.id === user.id ? newRole : ''}
                            onValueChange={(value) => {
                              if (value) {
                                setSelectedUser(user);
                                setNewRole(value as UserRole);
                                handleUpdateRole(user, value as UserRole);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem disabled={user.role === 'student'} value="student">Student</SelectItem>
                              <SelectItem disabled={user.role === 'faculty'} value="faculty">Faculty</SelectItem>
                              <SelectItem disabled={user.role === 'admin'} value="admin">Admin</SelectItem>
                              <SelectItem disabled={user.role === 'superadmin'} value="superadmin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRightsManagement;
