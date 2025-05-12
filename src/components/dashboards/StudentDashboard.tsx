
import React, { useEffect, useState } from 'react';
import { User, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';

interface StudentDashboardProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        // Transform the data to match the Announcement type
        const formattedAnnouncements: Announcement[] = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          createdAt: item.created_at,
          createdBy: item.created_by
        }));
        
        setAnnouncements(formattedAnnouncements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Subscribe to changes in the announcements table
    const announcementsChannel = supabase
      .channel('announcements_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Announcement change received:', payload);
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back, {user.name}!</p>

      <Card>
        <CardHeader>
          <CardTitle>New Announcements</CardTitle>
          <CardDescription>Latest campus updates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No announcements available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="pb-4 border-b last:border-0">
                  <h4 className="text-sm font-medium">{announcement.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    {announcement.content}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(announcement.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <a href="/announcements" className="text-sm text-primary hover:underline">View all announcements</a>
        </CardFooter>
      </Card>
    </div>
  );
};
