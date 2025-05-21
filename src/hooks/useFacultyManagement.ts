
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase, isError } from "@/integrations/supabase/client";

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
        .eq('status', 'approved' as any);
        
      if (facultyRequestsError) throw facultyRequestsError;
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty' as any);
        
      if (profilesError) throw profilesError;
      
      const facultyIds = new Set();
      const combinedFaculty: FacultyMember[] = [];
      
      if (facultyRequestsData && Array.isArray(facultyRequestsData) && !isError(facultyRequestsData)) {
        facultyRequestsData.forEach(item => {
          if (item.user_id) {
            facultyIds.add(item.user_id);
            combinedFaculty.push({
              id: item.id?.toString() || '',
              name: item.name?.toString() || '',
              email: item.email?.toString() || '',
              department: item.department?.toString() || '',
              status: (item.status as 'pending' | 'approved' | 'rejected') || 'approved',
              createdAt: item.created_at?.toString() || '',
              user_id: item.user_id?.toString() || ''
            });
          }
        });
      }
      
      if (profilesData && Array.isArray(profilesData) && !isError(profilesData)) {
        profilesData.forEach(profile => {
          if (profile.id && !facultyIds.has(profile.id)) {
            combinedFaculty.push({
              id: profile.id?.toString() || '',
              name: profile.name?.toString() || '',
              email: profile.email?.toString() || '',
              department: 'N/A',
              status: 'approved',
              createdAt: profile.created_at?.toString() || '',
              user_id: profile.id?.toString() || ''
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
