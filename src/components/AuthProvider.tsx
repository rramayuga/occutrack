
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/lib/auth';
import { User, UserRole } from '@/lib/types';
import { useToast } from './ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create a reusable function to fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // First check if this is a faculty member with a rejected request
      const { data: facultyRequest, error: facultyError } = await supabase
        .from('faculty_requests')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'rejected')
        .maybeSingle();

      if (facultyError) {
        console.error('Error checking faculty status:', facultyError);
      }
      
      // If the faculty request was rejected, sign the user out and show a message
      if (facultyRequest && facultyRequest.status === 'rejected') {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'Your faculty account request has been rejected. Please contact administration for more information.',
          variant: 'destructive'
        });
        navigate('/login');
        setIsLoading(false);
        setUser(null);
        return null;
      }

      // Continue with normal profile fetching
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (profile) {
        const userData = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar
        };
        
        setUser(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  // Add a refresh user method
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Check active sessions and set up subscription for auth changes
    const setupAuth = async () => {
      setIsLoading(true);
      
      // First, set up the auth change subscription
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            try {
              const userData = await fetchUserProfile(session.user.id);
              if (!userData) {
                setUser(null);
              }
            } catch (error) {
              console.error('Error in auth state change handler:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      // Then check the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          await fetchUserProfile(session.user.id);
        } catch (error) {
          console.error('Error fetching initial user profile:', error);
          setUser(null);
        }
      } else {
        setIsLoading(false);
      }

      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, [fetchUserProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
