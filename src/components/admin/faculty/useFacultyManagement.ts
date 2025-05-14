
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FacultyMember } from '@/lib/types';

export const useFacultyManagement = () => {
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // New state for delete dialog
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const location = useLocation();

  const fetchFacultyMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('faculty_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedData: FacultyMember[] = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          department: item.department,
          status: item.status as 'pending' | 'approved' | 'rejected',
          createdAt: item.created_at,
          user_id: item.user_id,
        }));
        
        setFacultyMembers(transformedData);
        setFilteredMembers(transformedData);
        
        const stateParams = location.state as { selectedFacultyId?: string; isEditing?: boolean } | null;
        if (stateParams?.selectedFacultyId) {
          const faculty = transformedData.find(f => f.id === stateParams.selectedFacultyId);
          if (faculty) {
            setSelectedFaculty(faculty);
            if (stateParams.isEditing) {
              setIsDialogOpen(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching faculty members:', error);
      toast({
        title: 'Error',
        description: 'Could not load faculty members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyMembers();

    const facultyChannel = supabase
      .channel('faculty_requests_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'faculty_requests' 
      }, () => {
        fetchFacultyMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(facultyChannel);
    };
  }, []);

  useEffect(() => {
    let filtered = [...facultyMembers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        member => 
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.department.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, statusFilter, facultyMembers]);

  const handleUpdateStatus = async (faculty: FacultyMember, newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'rejected' && !notes.trim() && faculty.status === 'pending') {
        setSelectedFaculty(faculty);
        setIsDialogOpen(true);
        return;
      }
      
      const { error } = await supabase
        .from('faculty_requests')
        .update({ 
          status: newStatus,
          notes: notes || null
        })
        .eq('id', faculty.id);

      if (error) throw error;

      if (newStatus === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'faculty' })
          .eq('id', faculty.user_id);
          
        if (profileError) {
          console.error('Error updating user role:', profileError);
        }
      }

      if (newStatus === 'rejected') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'student' })
          .eq('id', faculty.user_id);
          
        if (profileError) {
          console.error('Error updating user role:', profileError);
        }
      }

      toast({
        title: 'Status Updated',
        description: `Faculty request ${newStatus}`,
      });
      
      setNotes('');
      setIsDialogOpen(false);
      setSelectedFaculty(null);
      
      fetchFacultyMembers();
    } catch (error) {
      console.error('Error updating faculty status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update faculty status',
        variant: 'destructive'
      });
    }
  };

  // New delete faculty function
  const handleDeleteFaculty = async (faculty: FacultyMember) => {
    try {
      setIsLoading(true);
      
      // First delete from faculty_requests
      const { error: facultyRequestError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('id', faculty.id);
        
      if (facultyRequestError) throw facultyRequestError;

      // Then delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', faculty.user_id);
        
      if (profileError) {
        console.error('Warning: Error deleting profile', profileError);
        // We still continue as profile might not exist or be managed separately
      }

      toast({
        title: 'Faculty Deleted',
        description: `${faculty.name} has been successfully removed from the system`,
      });
      
      // Refresh the faculty members list
      fetchFacultyMembers();
      
      // Close any open dialogs
      setIsDeleteDialogOpen(false);
      setSelectedFaculty(null);
      
    } catch (error: any) {
      console.error('Error deleting faculty:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete faculty member',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReject = () => {
    if (selectedFaculty) {
      handleUpdateStatus(selectedFaculty, 'rejected');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return {
    facultyMembers,
    filteredMembers,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedFaculty,
    setSelectedFaculty,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    notes,
    setNotes,
    handleUpdateStatus,
    handleDeleteFaculty,
    handleConfirmReject,
    formatDate
  };
};
