
import React from 'react';
import { Check, X, UserX, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { FacultyMember } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FacultyListProps {
  isLoading: boolean;
  filteredMembers: FacultyMember[];
  handleUpdateStatus: (faculty: FacultyMember, newStatus: 'approved' | 'rejected') => void;
  onRejectClick: (faculty: FacultyMember) => void;
  onDeleteClick: (faculty: FacultyMember) => void;
  formatDate: (dateString: string) => string;
}

const FacultyList: React.FC<FacultyListProps> = ({
  isLoading,
  filteredMembers,
  handleUpdateStatus,
  onRejectClick,
  onDeleteClick,
  formatDate
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.map((faculty) => (
            <TableRow key={faculty.id}>
              <TableCell className="font-medium">{faculty.name}</TableCell>
              <TableCell>{faculty.email}</TableCell>
              <TableCell>{faculty.department}</TableCell>
              <TableCell>{formatDate(faculty.createdAt)}</TableCell>
              <TableCell>{getStatusBadge(faculty.status)}</TableCell>
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
