
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle, XCircle, Search, UserCheck, UserX, Clock
} from 'lucide-react';
import { Faculty } from '@/lib/types';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Fetch faculty data from Supabase
    const fetchFacultyRequests = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('faculty_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setFaculty(data.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            department: item.department,
            status: item.status as 'pending' | 'approved' | 'rejected',
            dateApplied: new Date(item.created_at).toISOString().split('T')[0]
          })));
        }
      } catch (error) {
        console.error("Error fetching faculty requests:", error);
        toast({
          title: "Error loading data",
          description: "Could not load faculty data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyRequests();
  }, [toast]);

  // Approve faculty
  const approveFaculty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faculty_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update user role in the profiles table
      const facultyToApprove = faculty.find(f => f.id === id);
      if (facultyToApprove?.email) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .update({ role: 'faculty' })
          .eq('email', facultyToApprove.email);
        
        if (userError) throw userError;
      }
      
      // Update local state
      setFaculty(faculty.map(f => 
        f.id === id ? { ...f, status: 'approved' as const } : f
      ));
      
      toast({
        title: "Faculty approved",
        description: "The faculty account has been approved."
      });
    } catch (error) {
      console.error("Error approving faculty:", error);
      toast({
        title: "Error",
        description: "Could not approve faculty request.",
        variant: "destructive"
      });
    }
  };

  // Reject faculty
  const rejectFaculty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faculty_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setFaculty(faculty.map(f => 
        f.id === id ? { ...f, status: 'rejected' as const } : f
      ));
      
      toast({
        title: "Faculty rejected",
        description: "The faculty account has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting faculty:", error);
      toast({
        title: "Error",
        description: "Could not reject faculty request.",
        variant: "destructive"
      });
    }
  };

  // Filter faculty based on search term
  const filteredFaculty = faculty.filter(f => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(searchLower) ||
      f.email.toLowerCase().includes(searchLower) ||
      f.department.toLowerCase().includes(searchLower)
    );
  });

  // Group faculty by status
  const pendingFaculty = filteredFaculty.filter(f => f.status === 'pending');
  const approvedFaculty = filteredFaculty.filter(f => f.status === 'approved');
  const rejectedFaculty = filteredFaculty.filter(f => f.status === 'rejected');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow pt-20">
        <h1 className="text-3xl font-bold mb-6">Faculty Management</h1>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Manage Faculty Accounts</h2>
              <p className="text-muted-foreground">View and manage faculty accounts</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Faculty Queue */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Badge variant="outline" className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">
                        {pendingFaculty.length}
                      </Badge>
                      Pending Approval Requests
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Faculty accounts waiting for approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingFaculty.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">No pending faculty requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingFaculty.map((faculty) => (
                        <div key={faculty.id} className="p-4 border rounded-lg flex justify-between items-center">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <div className="font-medium">{faculty.name}</div>
                              <div className="text-xs text-muted-foreground">{faculty.email}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Department: {faculty.department} • Applied: {faculty.dateApplied}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-green-500 hover:bg-green-50 text-green-600"
                              onClick={() => approveFaculty(faculty.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-500 hover:bg-red-50 text-red-600"
                              onClick={() => rejectFaculty(faculty.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Approved Faculty Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
                        {approvedFaculty.length}
                      </Badge>
                      Approved Faculty
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Faculty accounts that have been approved
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approvedFaculty.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">No approved faculty accounts</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {approvedFaculty.map((faculty) => (
                        <div key={faculty.id} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium truncate">{faculty.name}</div>
                              <div className="text-xs text-muted-foreground">{faculty.department}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Rejected Faculty */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 hover:bg-red-100 border-red-300">
                      {rejectedFaculty.length}
                    </Badge>
                    Rejected Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rejectedFaculty.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">No rejected faculty applications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rejectedFaculty.map((faculty) => (
                        <div key={faculty.id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <UserX className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-medium">{faculty.name}</div>
                              <div className="text-xs text-muted-foreground">{faculty.email}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Rejected
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
