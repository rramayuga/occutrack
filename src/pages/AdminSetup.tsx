
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from 'lucide-react';
import { createAdminAccount } from '@/utils/admin-account';
import { useNavigate } from 'react-router-dom';

const AdminSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  const navigate = useNavigate();

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    setResult({});
    
    try {
      // Admin credentials are hardcoded as per request
      const email = "admin@neu.edu.ph";
      const password = "admin123";
      
      const response = await createAdminAccount(email, password);
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred during account creation'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Account Setup</CardTitle>
          <CardDescription>
            Create an administrator account for NEU OccuTrack
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Email:</p>
              <p className="text-muted-foreground">admin@neu.edu.ph</p>
            </div>
            
            <div>
              <p className="font-medium">Password:</p>
              <p className="text-muted-foreground">admin123</p>
            </div>
            
            {result.message && (
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} flex items-center`}>
                {result.success ? 
                  <CheckCircle className="h-5 w-5 mr-2" /> : 
                  <AlertCircle className="h-5 w-5 mr-2" />}
                <p>{result.message}</p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button 
            onClick={handleCreateAdmin} 
            className="w-full" 
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Admin Account'}
          </Button>
          
          {result.success && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSetup;
