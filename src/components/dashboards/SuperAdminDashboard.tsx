
import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminDashboardProps {
  user: User;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  // Enable real-time updates on mount
  useEffect(() => {
    // Set up real-time subscription for announcements
    const announcementsChannel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'announcements' 
          }, 
          (payload) => {
            console.log('Real-time announcement change received:', payload);
            // Show toast notification when an announcement is created or updated
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Announcement Posted",
                description: "A new announcement has been added to the system."
              });
            } else if (payload.eventType === 'UPDATE') {
              toast({
                title: "Announcement Updated",
                description: "An announcement has been modified."
              });
            } else if (payload.eventType === 'DELETE') {
              toast({
                title: "Announcement Removed",
                description: "An announcement has been deleted from the system."
              });
            }
          })
      .subscribe();

    setIsRealTimeEnabled(true);
    console.log('Real-time updates for announcements enabled');

    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, [toast]);

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Super Administrator Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={() => handleNavigation('/user-rights')}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Manage User Rights
        </Button>
        <Button 
          onClick={() => handleNavigation('/admin/announcements')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Post Announcements
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the buttons above to manage user rights or post announcements to the system.
              {isRealTimeEnabled && (
                <span className="block mt-2 text-xs text-green-600">
                  ✓ Real-time updates enabled
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
