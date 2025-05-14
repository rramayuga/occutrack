
import React from 'react';
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
import { Trash2 } from 'lucide-react';

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
  handleEditFaculty: (facultyId: string) => void;
  handleDeleteFaculty?: (facultyId: string) => void; // Added delete handler
}

const FacultyTab: React.FC<FacultyTabProps> = ({
  isLoadingFaculty,
  facultyMembers,
  handleViewFaculty,
  handleEditFaculty,
  handleDeleteFaculty,
}) => {
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
                      onClick={() => handleEditFaculty(faculty.user_id)}
                    >
                      Edit
                    </Button>
                    {handleDeleteFaculty && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteFaculty(faculty.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
    </div>
  );
};

export default FacultyTab;
