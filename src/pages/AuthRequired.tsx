
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const AuthRequiredPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Required</CardTitle>
          <CardDescription>
            You need to be logged in to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This area requires authentication. Please log in with your credentials to continue.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
          <Button onClick={() => navigate('/login')}>
            Log In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthRequiredPage;
