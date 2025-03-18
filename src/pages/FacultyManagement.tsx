
import React, { useState, useEffect } from 'react';
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle, XCircle, Search, UserCheck, UserX
} from 'lucide-react';
import { Input } from "@/components/ui/input";

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  dateApplied: string;
}

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

  // Group faculty by status
  const pendingFaculty = filteredFaculty.filter(f => f.status === 'pending');
  const approvedFaculty = filteredFaculty.filter(f => f.status === 'approved');
  const rejectedFaculty = filteredFaculty.filter(f => f.status === 'rejected');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Faculty Management</h1>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Faculty Approval</h2>
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
            <p className="text-center py-8">Loading faculty data...</p>
          ) : (
            <div className="space-y-6">
              {/* Pending Faculty */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Badge variant="outline" className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">
                      {pendingFaculty.length}
                    </Badge>
                    Pending Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingFaculty.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No pending faculty approvals.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Date Applied</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingFaculty.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.name}</TableCell>
                            <TableCell>{f.email}</TableCell>
                            <TableCell>{f.department}</TableCell>
                            <TableCell>{f.dateApplied}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => approveFaculty(f.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => rejectFaculty(f.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              {/* Approved Faculty */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
                      {approvedFaculty.length}
                    </Badge>
                    Approved Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {approvedFaculty.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No approved faculty members.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedFaculty.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.name}</TableCell>
                            <TableCell>{f.email}</TableCell>
                            <TableCell>{f.department}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
                                Approved
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Rejected Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rejectedFaculty.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No rejected faculty members.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedFaculty.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.name}</TableCell>
                            <TableCell>{f.email}</TableCell>
                            <TableCell>{f.department}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300">
                                Rejected
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
