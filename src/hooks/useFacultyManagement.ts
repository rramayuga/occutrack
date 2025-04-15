
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

  useEffect(() => {
    fetchFacultyData();
  }, []);

  return {
    facultyCount,
    facultyMembers,
    isLoadingFaculty,
    fetchFacultyData
  };
};
