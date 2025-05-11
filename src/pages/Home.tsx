
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect based on user role
  const handleGetStarted = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    switch(user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'superadmin':
        navigate('/admin');
        break;
      case 'faculty':
        navigate('/rooms');
        break;
      case 'student':
        navigate('/rooms');
        break;
      default:
        navigate('/rooms');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-24 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Campus Room Management System
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-3xl">
          Book classrooms, track room availability, and manage campus facilities all in one place.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={handleGetStarted}>
            Get Started
          </Button>
          {!user && (
            <Button size="lg" variant="outline" onClick={() => navigate('/register')}>
              Create Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
