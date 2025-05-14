
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Announcement } from '@/lib/types';

export const useAnnouncementManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createAnnouncement = async (title: string, content: string, userId: string) => {
    try {
      setIsLoading(true);
      
      if (!title.trim() || !content.trim()) {
        toast({
          title: "Error",
          description: "Title and content are required.",
          variant: "destructive"
        });
        return null;
      }
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content,
          created_by: userId
        }])
        .select('*')
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAnnouncement = async (id: string, title: string, content: string) => {
    try {
      setIsLoading(true);
      
      if (!title.trim() || !content.trim()) {
        toast({
          title: "Error",
          description: "Title and content are required.",
          variant: "destructive"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('announcements')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  };
};
