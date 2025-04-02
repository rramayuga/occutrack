
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, GraduationCap, UserCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacultyMember } from '@/lib/types';

interface StaffOverviewProps {
  adminUsers: any[];
  facultyMembers: FacultyMember[];
  isLoading: boolean;
}

const StaffOverview: React.FC<StaffOverviewProps> = ({ adminUsers, facultyMembers, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Admin Users Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Administrative Staff</CardTitle>
            <CardDescription>Managers and campus admins</CardDescription>
          </div>
          <Shield className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">Loading admin data...</div>
          ) : adminUsers.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No admin users found</div>
          ) : (
            <div className="space-y-4">
              {adminUsers.slice(0, 5).map((admin, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Badge className="capitalize">{admin.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/admin/users'}>
            Manage Admin Users
          </Button>
        </CardFooter>
      </Card>

      {/* Faculty Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Faculty Members</CardTitle>
            <CardDescription>Academic teaching staff</CardDescription>
          </div>
          <GraduationCap className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">Loading faculty data...</div>
          ) : facultyMembers.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No faculty members found</div>
          ) : (
            <div className="space-y-4">
              {facultyMembers.slice(0, 5).map((faculty, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{faculty.name}</p>
                      <p className="text-xs text-muted-foreground">{faculty.department}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/faculty-management'}>
            Manage Faculty Members
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StaffOverview;
