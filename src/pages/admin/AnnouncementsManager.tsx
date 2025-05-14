import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Announcement } from '@/lib/types';
import { useAnnouncementManagement } from '@/hooks/useAnnouncementManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement, 
    isLoading: isActionLoading 
  } = useAnnouncementManagement();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up realtime subscription with consistent channel name
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, () => {
        console.log('Realtime update for announcements detected');
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
    if (user) {
      console.log('Creating announcement:', { title, content, userId: user.id });
      const result = await createAnnouncement(title, content, user.id);
      if (result) {
        console.log('Announcement created successfully:', result);
        setTitle('');
        setContent('');
        setIsAddDialogOpen(false);
      }
    }
  };

  const handleEditAnnouncement = async () => {
    if (selectedAnnouncement) {
      console.log('Updating announcement:', { id: selectedAnnouncement.id, title, content });
      const success = await updateAnnouncement(
        selectedAnnouncement.id,
        title,
        content
      );
      
      if (success) {
        console.log('Announcement updated successfully');
        setIsEditDialogOpen(false);
        setSelectedAnnouncement(null);
        setTitle('');
        setContent('');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedAnnouncement) {
      console.log('Deleting announcement:', selectedAnnouncement.id);
      const success = await deleteAnnouncement(selectedAnnouncement.id);
      
      if (success) {
        console.log('Announcement deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedAnnouncement(null);
      }
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-4">You do not have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Announcements</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> New Announcement
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No announcements available.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              Create your first announcement
            </Button>
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
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(announcement)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => openDeleteDialog(announcement)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Add Announcement Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>
                Add a new announcement that will be visible to all users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="add-title" className="block text-sm font-medium">Title</label>
                <Input
                  id="add-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="add-content" className="block text-sm font-medium">Content</label>
                <Textarea
                  id="add-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setTitle('');
                  setContent('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddAnnouncement} 
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Creating...' : 'Create Announcement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Announcement Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>
                Make changes to the existing announcement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="block text-sm font-medium">Title</label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-content" className="block text-sm font-medium">Content</label>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedAnnouncement(null);
                  setTitle('');
                  setContent('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditAnnouncement}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
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
                setSelectedAnnouncement(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
