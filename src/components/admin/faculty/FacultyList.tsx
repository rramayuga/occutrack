
import React from 'react';
import { Check, X, UserX, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { FacultyMember } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacultyListProps {
  isLoading: boolean;
  filteredMembers: FacultyMember[];
  handleUpdateStatus: (faculty: FacultyMember, newStatus: 'approved' | 'rejected') => void;
  onRejectClick: (faculty: FacultyMember) => void;
  onDeleteClick: (faculty: FacultyMember) => void;
  formatDate: (dateString: string) => string;
  onDepartmentChange?: (faculty: FacultyMember, department: string) => void;
}

const FacultyList: React.FC<FacultyListProps> = ({
  isLoading,
  filteredMembers,
  handleUpdateStatus,
  onRejectClick,
  onDeleteClick,
  formatDate,
  onDepartmentChange
}) => {
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

  if (isLoading) {
    return <div className="text-center py-10">Loading faculty members...</div>;
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-10">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No faculty members found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Requested On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.map((faculty) => (
            <TableRow key={faculty.id}>
              <TableCell className="font-medium">{faculty.name}</TableCell>
              <TableCell>{faculty.email}</TableCell>
              <TableCell>
                <Select
                  defaultValue={faculty.department}
                  onValueChange={(value) => onDepartmentChange && onDepartmentChange(faculty, value)}
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
              <TableCell>{formatDate(faculty.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {faculty.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 text-green-600 hover:bg-green-100"
                        onClick={() => handleUpdateStatus(faculty, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={() => onRejectClick(faculty)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {faculty.status === 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-600 hover:bg-green-100"
                      onClick={() => handleUpdateStatus(faculty, 'approved')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {faculty.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => onRejectClick(faculty)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}
                  {/* Delete button for all faculty members */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => onDeleteClick(faculty)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FacultyList;
