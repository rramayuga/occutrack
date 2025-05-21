
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

const FacultyManagement = () => {
  const [isRightsManagementOpen, setIsRightsManagementOpen] = useState(false);
  
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
    formatDate
  } = useFacultyManagement();

  const onRejectClick = (faculty: React.SetStateAction<import("@/lib/types").FacultyMember | null>) => {
    setSelectedFaculty(faculty);
    setIsDialogOpen(true);
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
        
        <UserRightsManagement 
          open={isRightsManagementOpen} 
          onClose={() => setIsRightsManagementOpen(false)} 
        />
      </div>
    </div>
  );
};

export default FacultyManagement;
