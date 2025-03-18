import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Building, Mail, User, Lock, AlertCircle, Book } from 'lucide-react';

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
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: password || '',
          options: {
            data: {
              name,
              role: 'student'
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: requestError } = await supabase
            .from('faculty_requests')
            .insert({
              user_id: authData.user.id,
              name,
              email,
              department,
              status: 'pending'
            });

          if (requestError) throw requestError;
          
          toast({
            title: "Registration Submitted",
            description: "Your faculty account request has been submitted for approval.",
          });
          
          navigate('/faculty-confirmation');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: password || '',
          options: {
            data: {
              name,
              role: 'student'
            }
          }
        });

        if (signUpError) throw signUpError;
        
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
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading || (isGoogleSignIn && !!name)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m.example@university.edu" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || (isGoogleSignIn && !!email)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {showDepartmentField && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Book className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={department} 
                    onValueChange={setDepartment}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="department" className="pl-10 w-full">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {!isGoogleSignIn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          
          {!isGoogleSignIn && (
            <>
              <div className="relative">
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
                className="w-full" 
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
