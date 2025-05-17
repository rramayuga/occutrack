
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchFacultyData = async () => {
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
      
      setFacultyCount(combinedFaculty.length);
      setFacultyMembers(combinedFaculty);
    } catch (error) {
      console.error('Error fetching faculty data:', error);
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  // New function to delete faculty member
  const deleteFacultyMember = async (faculty: FacultyMember) => {
    try {
      // 1. First update profiles table to change role back to 'student'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', faculty.user_id);
        
      if (profileError) {
        console.error("Error updating profile role:", profileError);
        throw profileError;
      }
      
      console.log(`Successfully updated user ${faculty.user_id} role to student`);
      
      // 2. Then delete from faculty_requests table if it exists there
      // This second step only applies to users who went through the faculty request process
      if (faculty.id !== faculty.user_id) { // This check helps identify if it's from faculty_requests
        const { error: facultyRequestError } = await supabase
          .from('faculty_requests')
          .delete()
          .eq('id', faculty.id);
          
        if (facultyRequestError) {
          console.error("Error deleting from faculty_requests:", facultyRequestError);
          throw facultyRequestError;
        }
        
        console.log(`Successfully deleted faculty request ${faculty.id}`);
      }
      
      // Refresh the faculty data after deletion
      await fetchFacultyData();
      
      return true;
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  return {
    facultyCount,
    facultyMembers,
    isLoadingFaculty,
    fetchFacultyData,
    deleteFacultyMember
  };
};
