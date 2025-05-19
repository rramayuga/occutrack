
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Building } from 'lucide-react';
import { handleGoogleSignIn } from '@/utils/auth-utils';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleGoogleAuth = async () => {
    try {
      await handleGoogleSignIn();
      toast({
        title: "Google Authentication",
        description: "Redirecting to Google sign-in...",
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Sign in with your NEU Google account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            onClick={handleGoogleAuth}
          >
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Only NEU domain allowed
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
