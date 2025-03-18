
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
import {
  CheckCircle, XCircle, Search, UserCheck, UserX
} from 'lucide-react';
import { Faculty } from '@/lib/types';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Fetch faculty data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, we're just checking localStorage for any saved data
        const savedFaculty = localStorage.getItem('faculty');
        
        if (savedFaculty) {
          // Filter out pending faculty
          const parsedFaculty = JSON.parse(savedFaculty);
          const nonPendingFaculty = parsedFaculty.filter((f: Faculty) => f.status !== 'pending');
          setFaculty(nonPendingFaculty);
          localStorage.setItem('faculty', JSON.stringify(nonPendingFaculty));
        } else {
          // Default demo data - only approved faculty (removed all pending)
          const demoFaculty: Faculty[] = [
            {
              id: 'faculty3',
              name: 'Dr. Alice Johnson',
              email: 'alice.johnson@university.edu',
              department: 'Mathematics',
              status: 'approved',
              dateApplied: '2023-04-10'
            }
          ];
          setFaculty(demoFaculty);
          localStorage.setItem('faculty', JSON.stringify(demoFaculty));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error loading data",
          description: "Could not load faculty data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Save data to localStorage
  const saveFacultyData = (updatedFaculty: Faculty[]) => {
    try {
      localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
      setFaculty(updatedFaculty);
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error saving data",
        description: "Could not save faculty data.",
        variant: "destructive"
      });
    }
  };

  // Approve faculty
  const approveFaculty = (id: string) => {
    const updatedFaculty = faculty.map(f => 
      f.id === id ? { ...f, status: 'approved' as const } : f
    );
    
    saveFacultyData(updatedFaculty);
    toast({
      title: "Faculty approved",
      description: "The faculty account has been approved."
    });
  };

  // Reject faculty
  const rejectFaculty = (id: string) => {
    const updatedFaculty = faculty.map(f => 
      f.id === id ? { ...f, status: 'rejected' as const } : f
    );
    
    saveFacultyData(updatedFaculty);
    toast({
      title: "Faculty rejected",
      description: "The faculty account has been rejected."
    });
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
              {/* No more Pending Faculty Queue - removed as requested */}
              
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
