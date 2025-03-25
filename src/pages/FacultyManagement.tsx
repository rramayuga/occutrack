
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
import { Check, X, Search, Filter, UserX } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { FacultyMember } from '@/lib/types';

const FacultyManagement = () => {
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Fetch faculty members
  const fetchFacultyMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('faculty_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedData: FacultyMember[] = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          department: item.department,
          status: item.status as 'pending' | 'approved' | 'rejected',
          createdAt: item.created_at,
        }));
        setFacultyMembers(transformedData);
        setFilteredMembers(transformedData);
      }
    } catch (error) {
      console.error('Error fetching faculty members:', error);
      toast({
        title: 'Error',
        description: 'Could not load faculty members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyMembers();

    // Setup subscription for real-time updates
    const facultyChannel = supabase
      .channel('faculty_requests_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'faculty_requests' 
      }, () => {
        fetchFacultyMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(facultyChannel);
    };
  }, []);

  // Apply filters when search query or status filter changes
  useEffect(() => {
    let filtered = [...facultyMembers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        member => 
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.department.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, statusFilter, facultyMembers]);

  const handleUpdateStatus = async (faculty: FacultyMember, newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'rejected' && !notes.trim() && faculty.status === 'pending') {
        setSelectedFaculty(faculty);
        setIsDialogOpen(true);
        return;
      }
      
      const { error } = await supabase
        .from('faculty_requests')
        .update({ 
          status: newStatus,
          notes: notes || null
        })
        .eq('id', faculty.id);

      if (error) throw error;

      // If approved, update the user's role in the profiles table
      if (newStatus === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'faculty' })
          .eq('id', faculty.user_id);
          
        if (profileError) {
          console.error('Error updating user role:', profileError);
        }
      }

      // If rejected and user had faculty role, reset to student
      if (newStatus === 'rejected') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'student' })
          .eq('id', faculty.user_id);
          
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
      setSelectedFaculty(null);
      
      // Refresh the list
      fetchFacultyMembers();
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
    if (selectedFaculty) {
      handleUpdateStatus(selectedFaculty, 'rejected');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <h1 className="text-2xl font-bold">Faculty Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Members</CardTitle>
            <CardDescription>
              Manage faculty registrations and approvals
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
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
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
            </div>

            {isLoading ? (
              <div className="text-center py-10">Loading faculty members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-10">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No faculty members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell className="font-medium">{faculty.name}</TableCell>
                        <TableCell>{faculty.email}</TableCell>
                        <TableCell>{faculty.department}</TableCell>
                        <TableCell>{formatDate(faculty.createdAt)}</TableCell>
                        <TableCell>{getStatusBadge(faculty.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {faculty.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-600 hover:bg-green-100"
                                  onClick={() => handleUpdateStatus(faculty, 'approved')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-600 hover:bg-red-100"
                                  onClick={() => {
                                    setSelectedFaculty(faculty);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {faculty.status === 'rejected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100"
                                onClick={() => handleUpdateStatus(faculty, 'approved')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
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
              <DialogTitle>Reject Faculty Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this faculty request. This information will be helpful for the user.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Rejection Reason (Optional)
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
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FacultyManagement;
