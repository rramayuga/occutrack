
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { User, UserRole } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  
  // Check if the current user has permission to view this page
  const hasPermission = isSuperAdmin || 
    (isAdmin && user && (user.role === 'student' || user.role === 'faculty'));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast({
            title: 'Error',
            description: 'User ID is missing',
            variant: 'destructive'
          });
          navigate('/user-rights');
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          toast({
            title: 'User not found',
            description: 'The requested user does not exist',
            variant: 'destructive'
          });
          navigate('/user-rights');
          return;
        }
        
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          avatarUrl: data.avatar
        });
        
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive'
        });
        navigate('/user-rights');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, navigate, toast]);
  
  useEffect(() => {
    // Check permission after user is loaded
    if (!loading && !hasPermission) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this user',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [loading, hasPermission, navigate, toast]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 pt-20">
          <Button 
            variant="ghost"
            onClick={() => navigate('/user-rights')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 pt-20">
        <Button 
          variant="ghost"
          onClick={() => navigate('/user-rights')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">User Details</CardTitle>
            <CardDescription>View information about {user.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-muted p-6">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={`${user.name}'s avatar`} 
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-16 w-16" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-medium">{user.name}</h3>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {user.email}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">User Role</h4>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                {user.role}
              </span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none">User ID</h4>
              <p className="text-sm text-muted-foreground">{user.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;
