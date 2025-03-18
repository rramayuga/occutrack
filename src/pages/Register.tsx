
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Building } from 'lucide-react';
import RegistrationForm from '@/components/auth/RegistrationForm';
import { handleStudentRegistration, handleFacultyRegistration } from '@/utils/auth-utils';

interface LocationState {
  fromGoogle?: boolean;
  email?: string;
  name?: string;
}

const Register = () => {
  const location = useLocation();
  const locationState = location.state as LocationState || {};
  
  const [name, setName] = useState(locationState.name || '');
  const [email, setEmail] = useState(locationState.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(Boolean(locationState.fromGoogle));
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const showDepartmentField = role === 'faculty';
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || (!isGoogleSignIn && (!password || !confirmPassword))) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (!isGoogleSignIn && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (showDepartmentField && !department) {
      setError('Please select a department.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (role === 'faculty') {
        await handleFacultyRegistration(email, password || '', name, department);
        toast({
          title: "Registration Submitted",
          description: "Your faculty account request has been submitted for approval.",
        });
        navigate('/faculty-confirmation');
      } else {
        const { data } = await handleStudentRegistration(email, password || '', name);
        if (data.user) {
          toast({
            title: "Registration Successful",
            description: "Welcome to OccuTrack!",
          });
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    toast({
      title: "Google Authentication",
      description: "Processing Google sign-in...",
    });
    
    setTimeout(() => {
      setIsGoogleSignIn(true);
      setEmail('google-user@gmail.com');
      setName('Google User');
      setIsLoading(false);
      
      toast({
        title: "Complete Your Profile",
        description: "Please choose your role to complete registration.",
      });
    }, 1000);
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
            Enter your details to register for OccuTrack
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <RegistrationForm
            name={name}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            role={role}
            department={department}
            isLoading={isLoading}
            error={error}
            isGoogleSignIn={isGoogleSignIn}
            showDepartmentField={showDepartmentField}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onRoleChange={setRole}
            onDepartmentChange={setDepartment}
            onSubmit={handleRegister}
            onGoogleSignIn={handleGoogleSignIn}
          />
          
          {!isGoogleSignIn && (
            <>
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                </svg>
                Google
              </Button>
            </>
          )}
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
