
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { FacultyMember } from '@/lib/types';

export const useSuperAdminData = () => {
  const [facultyCount, setFacultyCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch faculty members count and data
        const { data: facultyData, error: facultyError } = await supabase
          .from('faculty_requests')
          .select('*')
          .eq('status', 'approved');
          
        if (facultyError) throw facultyError;
        
        if (facultyData) {
          setFacultyCount(facultyData.length);
          const transformedData: FacultyMember[] = facultyData.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            department: item.department,
            status: item.status as 'pending' | 'approved' | 'rejected',
            createdAt: item.created_at,
            user_id: item.user_id
          }));
          setFacultyMembers(transformedData);
        }
        
        // Fetch admin users
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['admin', 'superadmin']);
          
        if (adminError) throw adminError;
        
        if (adminData) {
          setAdminCount(adminData.length);
          setAdminUsers(adminData);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return {
    facultyCount,
    adminCount,
    facultyMembers,
    adminUsers,
    isLoading
  };
};
