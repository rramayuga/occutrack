
import React, { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Users, Building, Settings, Plus, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AdminDashboardProps {
  user: User;
}

interface Building {
  id: string;
  name: string;
  rooms: number;
  utilization: string;
  createdBy: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  
  useEffect(() => {
    // Load buildings from localStorage
    const savedBuildings = localStorage.getItem('buildings');
    if (savedBuildings) {
      const allBuildings = JSON.parse(savedBuildings);
      // Filter buildings to show only those created by the current admin
      const adminBuildings = [
        { id: '1', name: 'Main Building', rooms: 48, utilization: '85%', createdBy: user.id },
        { id: '2', name: 'Science Complex', rooms: 32, utilization: '72%', createdBy: user.id },
        { id: '3', name: 'Arts Center', rooms: 24, utilization: '68%', createdBy: '123' },
        { id: '4', name: 'Technology Block', rooms: 24, utilization: '91%', createdBy: '123' }
      ].filter(building => building.createdBy === user.id);
      
      setBuildings(adminBuildings);
    }
  }, [user.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add New Room
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">{buildings.length}</span>
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">
                {buildings.reduce((total, building) => total + building.rooms, 0)}
              </span>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faculty Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">56</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">78%</span>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="buildings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Buildings Tab */}
        <TabsContent value="buildings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Building Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search buildings..." 
              />
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{building.name}</CardTitle>
                  <CardDescription>{building.rooms} rooms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization:</span>
                      <span>{building.utilization}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">View</Button>
                      <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {buildings.length === 0 && (
              <div className="col-span-3 text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">No buildings available. Add a building to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Faculty Tab */}
        <TabsContent value="faculty" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Faculty Management</h2>
            <div className="flex gap-2">
              <Input 
                className="max-w-xs" 
                placeholder="Search faculty..." 
              />
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border">
            <div className="grid grid-cols-5 font-medium p-4 border-b">
              <div>Name</div>
              <div>Department</div>
              <div>Email</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            {[
              { name: 'Dr. Sarah Johnson', department: 'Computer Science', email: 'sjohnson@edu.com', status: 'Active' },
              { name: 'Prof. Michael Chen', department: 'Physics', email: 'mchen@edu.com', status: 'Active' },
              { name: 'Dr. Emily Williams', department: 'Biology', email: 'ewilliams@edu.com', status: 'On Leave' },
              { name: 'Prof. James Smith', department: 'Mathematics', email: 'jsmith@edu.com', status: 'Active' }
            ].map((faculty, i) => (
              <div key={i} className="grid grid-cols-5 p-4 border-b last:border-0 items-center">
                <div>{faculty.name}</div>
                <div>{faculty.department}</div>
                <div className="text-sm">{faculty.email}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    faculty.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {faculty.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">System Analytics</h2>
            <div>
              <Button variant="outline" size="sm">
                Download Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Utilization</CardTitle>
                <CardDescription>Average usage per building</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Room utilization chart goes here</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Faculty Activity</CardTitle>
                <CardDescription>Teaching hours per department</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Faculty activity chart goes here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
