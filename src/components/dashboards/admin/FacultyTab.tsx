
import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user_id: string;
}

interface FacultyTabProps {
  isLoadingFaculty: boolean;
  facultyMembers: FacultyMember[];
  handleViewFaculty: (facultyId: string) => void;
  refreshFacultyData?: () => void; // Optional callback to refresh data after deletion
}

const FacultyTab: React.FC<FacultyTabProps> = ({
  isLoadingFaculty,
  facultyMembers,
  handleViewFaculty,
  refreshFacultyData,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (faculty: FacultyMember) => {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
    
    try {
      setIsDeleting(true);
      
      // 1. Delete from faculty_requests table
      const { error: facultyRequestError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('id', selectedFaculty.id);
        
      if (facultyRequestError) throw facultyRequestError;
      
      // 2. Delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedFaculty.user_id);
        
      if (profileError) throw profileError;
      
      toast({
        title: "Faculty deleted",
        description: `${selectedFaculty.name} has been removed successfully.`,
      });
      
      // Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      if (refreshFacultyData) {
        refreshFacultyData();
      }
      
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast({
        title: "Deletion failed",
        description: "There was a problem deleting this faculty member.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {isLoadingFaculty ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
      ) : facultyMembers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyMembers.map((faculty) => (
                <TableRow key={faculty.id}>
                  <TableCell className="font-medium">{faculty.name}</TableCell>
                  <TableCell>{faculty.email}</TableCell>
                  <TableCell>{faculty.department}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={faculty.status === 'approved' ? 'default' : 'secondary'}
                    >
                      {faculty.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {faculty.createdAt ? format(new Date(faculty.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewFaculty(faculty.user_id)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteClick(faculty)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">No faculty members found</p>
          <p className="text-sm text-muted-foreground">New faculty registrations will appear here.</p>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedFaculty?.name}'s account. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFaculty}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FacultyTab;
