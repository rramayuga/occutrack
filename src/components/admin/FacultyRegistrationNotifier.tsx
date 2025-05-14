import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/lib/auth';

export const FacultyRegistrationNotifier = () => {
  const [pendingFaculty, setPendingFaculty] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch pending faculty registrations
  const fetchPendingFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty')
        .eq('status', 'pending');
      
      if (error) throw error;
      
      if (data) {
        setPendingFaculty(data);
      }
    } catch (error) {
      console.error("Error fetching pending faculty:", error);
    }
  };

  // Approve a faculty member
  const approveFaculty = async (facultyId: string, facultyName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', facultyId);
      
      if (error) throw error;
      
      // Update local state
      setPendingFaculty(prev => prev.filter(f => f.id !== facultyId));
      
      toast({
        title: "Faculty Approved",
        description: `${facultyName} has been approved and can now access the system.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error approving faculty:", error);
      toast({
        title: "Error",
        description: "Failed to approve faculty member.",
        variant: "destructive",
      });
    }
  };

  // Reject a faculty member
  const rejectFaculty = async (facultyId: string, facultyName: string) => {
    try {
      // First, delete the user from auth
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('auth_id')
        .eq('id', facultyId)
        .single();
      
      if (userError) throw userError;
      
      if (userData?.auth_id) {
        // Delete the user from auth
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
          userData.auth_id
        );
        
        if (deleteAuthError) {
          console.error("Error deleting auth user:", deleteAuthError);
          // Continue anyway to delete the profile
        }
      }
      
      // Delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', facultyId);
      
      if (error) throw error;
      
      // Update local state
      setPendingFaculty(prev => prev.filter(f => f.id !== facultyId));
      
      toast({
        title: "Faculty Rejected",
        description: `${facultyName}'s registration has been rejected.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error rejecting faculty:", error);
      toast({
        title: "Error",
        description: "Failed to reject faculty member.",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription for new faculty registrations
  useEffect(() => {
    // Only admins and superadmins should see this
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return;
    }
    
    fetchPendingFaculty();
    
    // Subscribe to changes in the profiles table
    const profilesChannel = supabase
      .channel('faculty_registration_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'profiles',
        filter: 'role=eq.faculty' 
      }, (payload) => {
        console.log('New faculty registration:', payload);
        
        // Check if the new profile is pending
        if (payload.new && payload.new.status === 'pending') {
          // Add to the list
          setPendingFaculty(prev => [...prev, payload.new]);
          
          // Show notification
          const facultyName = payload.new.name || 'A new faculty member';
          toast({
            title: "New Faculty Registration",
            description: `${facultyName} has registered and is awaiting confirmation.`,
            duration: 10000,
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  // If no pending faculty, don't render anything
  if (pendingFaculty.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="bg-amber-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Faculty Registration Requests</CardTitle>
            <CardDescription>
              New faculty members awaiting approval
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            {pendingFaculty.length} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {pendingFaculty.map((faculty) => (
            <div key={faculty.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div>
                <h4 className="font-medium">{faculty.name}</h4>
                <p className="text-sm text-muted-foreground">{faculty.email}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => rejectFaculty(faculty.id, faculty.name)}
                >
                  Reject
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-200 text-green-600 hover:bg-green-50"
                  onClick={() => approveFaculty(faculty.id, faculty.name)}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex justify-between">
        <p className="text-xs text-muted-foreground">
          Approved faculty will gain immediate access to the system
        </p>
      </CardFooter>
    </Card>
  );
};

export default FacultyRegistrationNotifier;
