
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deleteUser } from '@/utils/auth-utils';

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user_id: string;
}

export const useFacultyManagement = () => {
  const [facultyCount, setFacultyCount] = useState(0);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const { toast } = useToast();

  const fetchFacultyData = useCallback(async () => {
    try {
      setIsLoadingFaculty(true);
      
      const { data: facultyRequestsData, error: facultyRequestsError } = await supabase
        .from('faculty_requests')
        .select('*')
        .eq('status', 'approved');
        
      if (facultyRequestsError) throw facultyRequestsError;
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty');
        
      if (profilesError) throw profilesError;
      
      const facultyIds = new Set();
      const combinedFaculty: FacultyMember[] = [];
      
      if (facultyRequestsData) {
        facultyRequestsData.forEach(item => {
          facultyIds.add(item.user_id);
          combinedFaculty.push({
            id: item.id,
            name: item.name,
            email: item.email,
            department: item.department,
            status: item.status as 'pending' | 'approved' | 'rejected',
            createdAt: item.created_at,
            user_id: item.user_id
          });
        });
      }
      
      if (profilesData) {
        profilesData.forEach(profile => {
          if (!facultyIds.has(profile.id)) {
            combinedFaculty.push({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              department: 'N/A',
              status: 'approved' as const,
              createdAt: profile.created_at,
              user_id: profile.id
            });
          }
        });
      }
      
      console.log('Faculty data fetched:', combinedFaculty);
      
      setFacultyCount(combinedFaculty.length);
      setFacultyMembers(combinedFaculty);
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      toast({
        title: "Error",
        description: "Failed to load faculty data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFaculty(false);
    }
  }, [toast]);

  // Function to delete faculty member
  const deleteFacultyMember = async (faculty: FacultyMember) => {
    try {
      console.log(`Attempting to delete faculty member: ${faculty.name} (${faculty.user_id})`);
      
      // First delete the faculty request if it exists
      const { error: facultyRequestError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('user_id', faculty.user_id);
      
      if (facultyRequestError) {
        console.error('Error deleting faculty request:', facultyRequestError);
        // Continue anyway as this might not exist for all faculty
      } else {
        console.log('Successfully deleted faculty request');
      }
      
      // Use the deleteUser utility function to handle complete user deletion
      await deleteUser(faculty.user_id);
      
      console.log(`Successfully deleted faculty member ${faculty.name} from Supabase`);
      
      // Update the local state immediately after successful deletion
      setFacultyMembers(prevMembers => 
        prevMembers.filter(member => member.user_id !== faculty.user_id)
      );
      
      // Update faculty count
      setFacultyCount(prev => prev - 1);
      
      toast({
        title: "Faculty Deleted",
        description: `${faculty.name} has been successfully removed.`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting faculty:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete faculty member',
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchFacultyData();
    
    // Set up a real-time subscription for faculty changes
    const facultyChannel = supabase
      .channel('faculty_changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'faculty_requests' }, 
          (payload) => {
            console.log('Faculty requests changes detected:', payload);
            fetchFacultyData();
          })
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          (payload) => {
            console.log('Profiles changes detected:', payload);
            fetchFacultyData();
          })
      .subscribe();
          
    return () => {
      supabase.removeChannel(facultyChannel);
    };
  }, [fetchFacultyData]);

  return {
    facultyCount,
    facultyMembers,
    isLoadingFaculty,
    fetchFacultyData,
    deleteFacultyMember
  };
};
