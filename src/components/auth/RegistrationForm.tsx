
import React from 'react';
import { UserRole } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Mail, User, Lock, Book, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationFormProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  department: string;
  isLoading: boolean;
  error: string;
  isGoogleSignIn: boolean;
  showDepartmentField: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRoleChange: (value: UserRole) => void;
  onDepartmentChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
}

const RegistrationForm = ({
  name,
  email,
  password,
  confirmPassword,
  role,
  department,
  isLoading,
  error,
  isGoogleSignIn,
  showDepartmentField,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRoleChange,
  onDepartmentChange,
  onSubmit,
  onGoogleSignIn
}: RegistrationFormProps) => {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm text-blue-700">
          Only users with <span className="font-semibold">@neu.edu.ph</span> email addresses can register.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="name" 
              placeholder="John Doe" 
              className="pl-10"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isLoading || (isGoogleSignIn && !!name)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">NEU Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="example@neu.edu.ph" 
              className="pl-10"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={isLoading || (isGoogleSignIn && !!email)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">I am a...</Label>
          <Select 
            value={role} 
            onValueChange={(value) => onRoleChange(value as UserRole)}
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
                onValueChange={onDepartmentChange}
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
                  onChange={(e) => onPasswordChange(e.target.value)}
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
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
    </div>
  );
};

export default RegistrationForm;
