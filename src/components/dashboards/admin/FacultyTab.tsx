
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
import { Trash } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { FacultyMember } from '@/hooks/useFacultyManagement';
import { deleteUser } from '@/utils/auth-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

interface FacultyTabProps {
  isLoadingFaculty: boolean;
  facultyMembers: FacultyMember[];
  handleViewFaculty: (facultyId: string) => void;
  refreshFacultyData?: () => void;
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
  const { toast } = useToast();

  // List of departments
  const departments = [
    "Computer Science",
    "Information Technology",
    "Engineering",
    "Business",
    "Education",
    "Arts and Sciences",
    "Medicine",
    "Law",
    "Architecture",
    "Nursing",
    "Other"
  ];

  const handleDeleteClick = (faculty: FacultyMember) => {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
    
    try {
      setIsDeleting(true);
      
      console.log("Permanently deleting user:", selectedFaculty);
      
      // First, try to delete the faculty request if it exists
      const { error: facultyRequestError } = await supabase
        .from('faculty_requests')
        .delete()
        .eq('user_id', selectedFaculty.user_id);
        
      if (facultyRequestError) {
        console.log("Error deleting faculty request or no faculty request found:", facultyRequestError);
        // Continue with user deletion even if faculty request deletion fails
      }
      
      // Then update the user's role to student
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', selectedFaculty.user_id);
        
      if (profileError) {
        console.error("Error updating user role:", profileError);
        throw profileError;
      }
      
      toast({
        title: "User role changed",
        description: `${selectedFaculty.name} has been demoted to student role.`,
      });
      
      // Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      if (refreshFacultyData) {
        refreshFacultyData();
      }
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Operation failed",
        description: "There was a problem updating this user's role.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDepartmentChange = async (faculty: FacultyMember, department: string) => {
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
      if (refreshFacultyData) {
        refreshFacultyData();
      }
      
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
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyMembers.map((faculty) => (
                <TableRow key={faculty.id}>
                  <TableCell className="font-medium">{faculty.name}</TableCell>
                  <TableCell>{faculty.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={faculty.department}
                      onValueChange={(value) => handleDepartmentChange(faculty, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {faculty.createdAt ? format(new Date(faculty.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewFaculty(faculty.id)}
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
                      Remove
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
              This will remove faculty privileges from {selectedFaculty?.name} and change their role to student.
              They can request faculty status again in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFaculty}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Processing..." : "Remove Faculty Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FacultyTab;
