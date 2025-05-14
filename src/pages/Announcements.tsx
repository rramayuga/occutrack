
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Announcement } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up realtime subscription to announcements table with consistent channel name
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, () => {
        console.log('Realtime update for announcements detected in Announcements.tsx');
        fetchAnnouncements();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          created_by,
          profiles:created_by (name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const formattedAnnouncements: Announcement[] = data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          createdAt: new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          createdBy: item.profiles?.name || 'Admin'
        }));
        
        setAnnouncements(formattedAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content,
          created_by: user?.id
        }]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Announcement posted successfully.",
      });
      
      setTitle('');
      setContent('');
      setIsAddingAnnouncement(false);
      // Real-time subscription will trigger a refresh
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: "Error",
        description: "Failed to post announcement.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Announcements</h1>
          {isAdmin && (
            <div className="flex space-x-3">
              <Button onClick={() => setIsAddingAnnouncement(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Post Announcement
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin/announcements'}>
                Manage All
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No announcements available.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription className="flex justify-between">
                    <span>Posted by {announcement.createdBy}</span>
                    <span>{announcement.createdAt}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line">{announcement.content}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isAddingAnnouncement} onOpenChange={setIsAddingAnnouncement}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post New Announcement</DialogTitle>
              <DialogDescription>
                Create a new announcement that will be visible to all users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">Title</label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="block text-sm font-medium">Content</label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAnnouncement(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAnnouncement}>
                Post Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Announcements;
