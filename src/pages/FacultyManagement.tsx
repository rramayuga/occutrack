
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import UserRightsManagement from '@/components/admin/UserRightsManagement';
import FacultyFilters from '@/components/admin/faculty/FacultyFilters';
import FacultyList from '@/components/admin/faculty/FacultyList';
import FacultyRejectionDialog from '@/components/admin/faculty/FacultyRejectionDialog';
import { useFacultyManagement } from '@/components/admin/faculty/useFacultyManagement';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { deleteUser } from '@/utils/auth-utils';
import { supabase } from '@/integrations/supabase/client';

const FacultyManagement = () => {
  const [isRightsManagementOpen, setIsRightsManagementOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredMembers,
    selectedFaculty,
    setSelectedFaculty,
    isDialogOpen,
    setIsDialogOpen,
    notes,
    setNotes,
    handleUpdateStatus,
    handleConfirmReject,
    formatDate,
    fetchFacultyMembers
  } = useFacultyManagement();

  const onRejectClick = (faculty: React.SetStateAction<import("@/lib/types").FacultyMember | null>) => {
    setSelectedFaculty(faculty);
    setIsDialogOpen(true);
  };

  const onDeleteClick = (faculty: React.SetStateAction<import("@/lib/types").FacultyMember | null>) => {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;

    try {
      setIsDeleting(true);
      console.log("Deleting user:", selectedFaculty);
      
      // Ensure user_id is available before attempting deletion
      if (!selectedFaculty.user_id) {
        throw new Error("Cannot delete user: Missing user ID");
      }
      
      // Call the deleteUser function
      await deleteUser(selectedFaculty.user_id);
      
      toast({
        title: "User deleted",
        description: `${selectedFaculty.name} has been permanently deleted from the system.`,
      });
      
      setIsDeleteDialogOpen(false);
      
      // Refresh the faculty list after deletion
      fetchFacultyMembers();
      
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDepartmentChange = async (faculty: import("@/lib/types").FacultyMember, department: string) => {
    try {
      console.log(`Updating department for ${faculty.name} to ${department}`);
      
      // Update the faculty_requests table
      const { error } = await supabase
        .from('faculty_requests')
        .update({ department })
        .eq('id', faculty.id);
        
      if (error) throw error;
      
      toast({
        title: "Department updated",
        description: `${faculty.name}'s department has been updated to ${department}.`,
      });
      
      // Refresh the faculty list
      fetchFacultyMembers();
      
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6 pt-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          <Button 
            variant="outline" 
            onClick={() => setIsRightsManagementOpen(true)}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Manage User Rights
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Faculty Members</CardTitle>
            <CardDescription>
              Manage faculty registrations and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacultyFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            <FacultyList
              isLoading={isLoading}
              filteredMembers={filteredMembers}
              handleUpdateStatus={handleUpdateStatus}
              onRejectClick={onRejectClick}
              onDeleteClick={onDeleteClick}
              formatDate={formatDate}
              onDepartmentChange={handleDepartmentChange}
            />
          </CardContent>
        </Card>
        
        <FacultyRejectionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedFaculty={selectedFaculty}
          notes={notes}
          setNotes={setNotes}
          onConfirmReject={handleConfirmReject}
        />
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedFaculty?.name}'s account. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFaculty}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <UserRightsManagement 
          open={isRightsManagementOpen} 
          onClose={() => setIsRightsManagementOpen(false)} 
        />
      </div>
    </div>
  );
};

export default FacultyManagement;
