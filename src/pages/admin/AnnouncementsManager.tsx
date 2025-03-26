import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/layout/Navbar';
import { Announcement } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const canManageAnnouncements = user?.role === 'admin' || user?.role === 'superadmin';
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          const formattedData: Announcement[] = data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            createdAt: item.created_at,
            createdBy: item.created_by
          }));
          
          setAnnouncements(formattedData);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast({
          title: 'Error',
          description: 'Could not load announcements',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
    
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, () => {
        fetchAnnouncements();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both title and content for the announcement',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (isEditMode && editingAnnouncementId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title,
            content,
          })
          .eq('id', editingAnnouncementId);
          
        if (error) throw error;
        
        toast({
          title: 'Announcement updated',
          description: 'The announcement has been successfully updated'
        });
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            title,
            content,
            created_by: user?.id
          });
          
        if (error) throw error;
        
        toast({
          title: 'Announcement posted',
          description: 'Your announcement has been successfully posted'
        });
      }
      
      setTitle('');
      setContent('');
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingAnnouncementId(null);
      
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Could not save announcement. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleEdit = (announcement: Announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setEditingAnnouncementId(announcement.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!deleteAnnouncementId) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', deleteAnnouncementId);
        
      if (error) throw error;
      
      toast({
        title: 'Announcement deleted',
        description: 'The announcement has been successfully removed'
      });
      
      setIsDeleteDialogOpen(false);
      setDeleteAnnouncementId(null);
      
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Could not delete announcement. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Announcements Management</h1>
          {canManageAnnouncements && (
            <Button onClick={() => {
              setTitle('');
              setContent('');
              setIsEditMode(false);
              setEditingAnnouncementId(null);
              setIsDialogOpen(true);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-10">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground">No announcements have been posted yet.</p>
                {canManageAnnouncements && (
                  <Button className="mt-4" onClick={() => {
                    setIsDialogOpen(true);
                  }}>
                    Create First Announcement
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            announcements.map(announcement => (
              <Card key={announcement.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{announcement.title}</CardTitle>
                    {canManageAnnouncements && (
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setDeleteAnnouncementId(announcement.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription>Posted on {formatDate(announcement.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Update the information below to modify the announcement.' 
                  : 'Add a new announcement to inform users about important updates.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input 
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea 
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement content"
                    rows={5}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update' : 'Post'} Announcement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteAnnouncementId(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
