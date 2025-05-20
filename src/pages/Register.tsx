
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
import { handleStudentRegistration, handleFacultyRegistration, handleGoogleSignIn } from '@/utils/auth-utils';

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
    
    // Validate NEU email domain
    if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
      setError('Only @neu.edu.ph email addresses are allowed to register.');
      return;
    }
    
    if (role === 'faculty' && !department) {
      setError('Please select a department.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (role === 'faculty') {
        const authData = await handleFacultyRegistration(email, password || '', name, department);
        if (authData.user) {
          toast({
            title: "Registration Submitted",
            description: "Your faculty account request has been submitted for approval.",
          });
          navigate('/faculty-confirmation');
        }
      } else {
        const authData = await handleStudentRegistration(email, password || '', name);
        if (authData.user) {
          toast({
            title: "Registration Successful",
            description: "Welcome to NEU OccuTrack!",
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
  
  const handleGoogleAuth = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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
            Enter your NEU email to register for OccuTrack
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
            showDepartmentField={role === 'faculty'}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onRoleChange={setRole}
            onDepartmentChange={setDepartment}
            onSubmit={handleRegister}
            onGoogleSignIn={handleGoogleAuth}
          />
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
