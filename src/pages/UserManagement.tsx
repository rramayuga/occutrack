
import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, UserX, ArrowUpAZ, ArrowDownAZ, Check, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { User, UserRole } from '@/lib/types';
import UserRoleSelector from '@/components/admin/users/UserRoleSelector';

type UserWithStatus = User & {
  status?: 'pending' | 'approved' | 'rejected';
  department?: string;
  facultyRequestId?: string;
};

type SortDirection = 'asc' | 'desc';
type UserStatus = 'pending' | 'approved' | 'rejected' | 'all';

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all users from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar');
      
      if (error) throw error;
      
      // Get faculty requests to determine status
      const { data: facultyRequests, error: facultyError } = await supabase
        .from('faculty_requests')
        .select('id, user_id, status, department');
      
      if (facultyError) throw facultyError;
      
      // Create a map of user IDs to faculty request details
      const facultyRequestMap = new Map();
      if (facultyRequests) {
        facultyRequests.forEach(request => {
          facultyRequestMap.set(request.user_id, {
            status: request.status,
            department: request.department,
            facultyRequestId: request.id
          });
        });
      }
      
      // Combine user profiles with faculty request status
      const usersWithStatus: UserWithStatus[] = profiles ? profiles.map(profile => {
        const facultyInfo = facultyRequestMap.get(profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar,
          status: facultyInfo ? facultyInfo.status as 'pending' | 'approved' | 'rejected' : undefined,
          department: facultyInfo ? facultyInfo.department : undefined,
          facultyRequestId: facultyInfo ? facultyInfo.facultyRequestId : undefined
        };
      }) : [];
      
      setUsers(usersWithStatus);
      applyFilters(usersWithStatus, searchQuery, roleFilter, statusFilter, sortDirection);
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

  const applyFilters = (
    userList: UserWithStatus[],
    search: string,
    role: UserRole | 'all',
    status: UserStatus,
    sort: SortDirection
  ) => {
    // Filter by search query
    let filtered = [...userList];
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.department && user.department.toLowerCase().includes(query))
      );
    }
    
    // Filter by role
    if (role !== 'all') {
      filtered = filtered.filter(user => user.role === role);
    }
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(user => user.status === status);
    }
    
    // Sort alphabetically by name
    filtered.sort((a, b) => {
      // First by status - pending always on top
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      // Then alphabetically by name
      const comparison = a.name.localeCompare(b.name);
      return sort === 'asc' ? comparison : -comparison;
    });
    
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();

    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, () => {
        fetchUsers();
      })
      .subscribe();
      
    const facultyRequestsChannel = supabase
      .channel('faculty_requests_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'faculty_requests' 
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(facultyRequestsChannel);
    };
  }, []);

  useEffect(() => {
    applyFilters(users, searchQuery, roleFilter, statusFilter, sortDirection);
  }, [searchQuery, roleFilter, statusFilter, sortDirection, users]);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateFacultyStatus = async (user: UserWithStatus, newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'rejected' && !notes.trim() && user.status === 'pending') {
        setSelectedUser(user);
        setIsDialogOpen(true);
        return;
      }
      
      if (!user.facultyRequestId) {
        toast({
          title: 'Error',
          description: 'No faculty request found for this user',
          variant: 'destructive'
        });
        return;
      }
      
      const { error } = await supabase
        .from('faculty_requests')
        .update({ 
          status: newStatus,
          notes: notes || null
        })
        .eq('id', user.facultyRequestId);

      if (error) throw error;

      if (newStatus === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'faculty' })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Error updating user role:', profileError);
        }
      }

      if (newStatus === 'rejected') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'student' })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Error updating user role:', profileError);
        }
      }

      toast({
        title: 'Status Updated',
        description: `Faculty request ${newStatus}`,
      });
      
      setNotes('');
      setIsDialogOpen(false);
      setSelectedUser(null);
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating faculty status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update faculty status',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmReject = () => {
    if (selectedUser) {
      handleUpdateFacultyStatus(selectedUser, 'rejected');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">No Status</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage users, roles, and faculty approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
                >
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
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
                
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as UserStatus)}
                >
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortDirection}
                  title={sortDirection === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
                >
                  {sortDirection === 'asc' ? 
                    <ArrowUpAZ className="h-4 w-4" /> : 
                    <ArrowDownAZ className="h-4 w-4" />
                  }
                </Button>
              </div>
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
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <UserRoleSelector 
                            currentRole={user.role} 
                            onRoleChange={(newRole) => handleRoleChange(user.id, newRole)} 
                          />
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          {user.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100"
                                onClick={() => handleUpdateFacultyStatus(user, 'approved')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {user.status === 'rejected' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-600 hover:bg-green-100"
                              onClick={() => handleUpdateFacultyStatus(user, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {user.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-600 hover:bg-red-100"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.status === 'rejected' ? 'Reject Faculty Request' : 
                 selectedUser?.status === 'approved' ? 'Change Faculty Status' : 'Reject Faculty Request'}
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for {selectedUser?.status === 'approved' ? 'changing' : 'rejecting'} this faculty request. This information will be helpful for the user.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                {selectedUser?.status === 'approved' ? 'Reason for Status Change' : 'Rejection Reason'} (Optional)
              </label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Insufficient credentials, duplicate request, etc."
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject}>
                Confirm {selectedUser?.status === 'approved' ? 'Change' : 'Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserManagement;
