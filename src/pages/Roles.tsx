
import { useState } from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from '@/components/layout/Navbar';
import { UserRole } from '@/lib/types';

const Roles = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  
  // Function to update the mock user in localStorage
  const setRoleCookie = (role: UserRole) => {
    localStorage.setItem('mockUserRole', role);
    setSelectedRole(role);
  };

  // Define role descriptions and buttons
  const roleCards = [
    {
      role: "student" as UserRole,
      title: "Student Dashboard",
      description: "View class schedules, room availability, and make reservations",
      color: "bg-blue-500"
    },
    {
      role: "professor" as UserRole,
      title: "Faculty Dashboard",
      description: "Manage teaching schedules, office hours, and room requests",
      color: "bg-green-500"
    },
    {
      role: "admin" as UserRole,
      title: "Administrator Dashboard",
      description: "Oversee facility usage, user accounts, and maintenance requests",
      color: "bg-amber-500"
    },
    {
      role: "superadmin" as UserRole,
      title: "Super Administrator Dashboard",
      description: "System-wide controls, campus network management, and security settings",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow px-4 py-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">Role Selection</h1>
          <p className="text-muted-foreground mb-8">Select a role to view the corresponding dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {roleCards.map((card) => (
              <Card 
                key={card.role} 
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedRole === card.role ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setRoleCookie(card.role)}
              >
                <CardHeader className={`${card.color} text-white rounded-t-lg`}>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription>{card.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button asChild size="lg" className="px-8 py-6 text-lg">
              <Link to="/dashboard">View Selected Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roles;
