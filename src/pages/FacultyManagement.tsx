
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
          setFaculty(JSON.parse(savedFaculty));
        } else {
          // Default demo data
          const demoFaculty: Faculty[] = [
            {
              id: 'faculty1',
              name: 'Dr. Jane Smith',
              email: 'jane.smith@university.edu',
              department: 'Computer Science',
              status: 'pending',
              dateApplied: '2023-04-15'
            },
            {
              id: 'faculty2',
              name: 'Prof. John Doe',
              email: 'john.doe@university.edu',
              department: 'Engineering',
              status: 'pending',
              dateApplied: '2023-04-14'
            },
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

  // Group faculty by status - Queue style focuses on pending first
  const pendingFaculty = filteredFaculty.filter(f => f.status === 'pending');
  const approvedFaculty = filteredFaculty.filter(f => f.status === 'approved');
  const rejectedFaculty = filteredFaculty.filter(f => f.status === 'rejected');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow pt-20">
        <h1 className="text-3xl font-bold mb-6">Faculty Approval Queue</h1>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Approve Faculty Accounts</h2>
              <p className="text-muted-foreground">Review and manage faculty account requests</p>
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
              <Card className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Badge variant="outline" className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">
                        {pendingFaculty.length}
                      </Badge>
                      Pending Applications
                    </CardTitle>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Awaiting Review
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingFaculty.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No pending faculty applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingFaculty.map((faculty) => (
                        <div key={faculty.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{faculty.name}</h3>
                              <div className="text-sm text-muted-foreground">{faculty.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {faculty.department}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Applied: {faculty.dateApplied}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-center">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveFaculty(faculty.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectFaculty(faculty.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recently Approved Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
                        {approvedFaculty.length}
                      </Badge>
                      Recently Approved
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
                      {approvedFaculty.slice(0, 6).map((faculty) => (
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
                {approvedFaculty.length > 6 && (
                  <CardFooter>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      View all approved
                    </Button>
                  </CardFooter>
                )}
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
