
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Building, Clock } from 'lucide-react';

const FacultyConfirmation = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Registration Successful</CardTitle>
          <CardDescription className="text-base">
            Your faculty account has been submitted for approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Pending Administrator Approval</span>
            </div>
            <p className="text-muted-foreground">
              Contact Administration to Approve/Activate your Account. You will be notified via email once your account has been approved.
            </p>
          </div>
          
          <div className="text-muted-foreground text-sm">
            <p>For any questions or to expedite the approval process, please contact:</p>
            <p className="font-medium mt-2">admin@university.edu</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">
              <Building className="mr-2 h-4 w-4" />
              Return to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FacultyConfirmation;
