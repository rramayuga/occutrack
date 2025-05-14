
import React, { useState, useEffect } from 'react';
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
import FacultyDeleteDialog from '@/components/admin/faculty/FacultyDeleteDialog';
import { useFacultyManagement } from '@/components/admin/faculty/useFacultyManagement';
import { useLocation } from 'react-router-dom';

const FacultyManagement = () => {
  const [isRightsManagementOpen, setIsRightsManagementOpen] = useState(false);
  const location = useLocation();
  
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
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    notes,
    setNotes,
    handleUpdateStatus,
    handleConfirmReject,
    handleDeleteFaculty,
    formatDate,
    facultyMembers
  } = useFacultyManagement();

  useEffect(() => {
    // Check if we need to open delete dialog based on navigation state
    const state = location.state as { selectedFacultyId?: string; isDeleting?: boolean } | null;
    if (state?.selectedFacultyId && state.isDeleting) {
      const faculty = facultyMembers.find(f => f.user_id === state.selectedFacultyId);
      if (faculty) {
        setSelectedFaculty(faculty);
        setIsDeleteDialogOpen(true);
      }
    }
  }, [location.state, facultyMembers, setSelectedFaculty, setIsDeleteDialogOpen]);

  const onRejectClick = (faculty: React.SetStateAction<import("@/lib/types").FacultyMember | null>) => {
    setSelectedFaculty(faculty);
    setIsDialogOpen(true);
  };

  const onDeleteClick = (faculty: React.SetStateAction<import("@/lib/types").FacultyMember | null>) => {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFaculty) {
      handleDeleteFaculty(selectedFaculty);
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
        
        <FacultyDeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          selectedFaculty={selectedFaculty}
          onConfirmDelete={handleConfirmDelete}
        />
        
        <UserRightsManagement 
          open={isRightsManagementOpen} 
          onClose={() => setIsRightsManagementOpen(false)} 
        />
      </div>
    </div>
  );
};

export default FacultyManagement;
