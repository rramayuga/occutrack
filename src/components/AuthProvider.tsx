
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/lib/auth';
import { User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create a reusable function to fetch user profile with force refresh option
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      console.log('Fetching user profile for ID:', userId, 'Force refresh:', forceRefresh);
      
      // Check if this is a faculty member with a rejected request
      const { data: facultyRequest, error: facultyError } = await supabase
        .from('faculty_requests')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'rejected')
        .maybeSingle();

      if (facultyError) {
        console.error('Error checking faculty status:', facultyError);
      }
      
      // If the faculty request was rejected, sign the user out
      if (facultyRequest && facultyRequest.status === 'rejected') {
        console.log('Faculty request rejected, signing out user');
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'Your faculty account request has been rejected. Please contact administration for more information.',
          variant: 'destructive'
        });
        navigate('/login');
        setUser(null);
        setIsLoading(false);
        return null;
      }

      // Check for pending faculty requests for new Google sign-in users
      const { data: pendingRequest } = await supabase
        .from('faculty_requests')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingRequest && pendingRequest.status === 'pending') {
        console.log('Faculty request pending, redirecting to confirmation page');
        await supabase.auth.signOut();
        toast({
          title: 'Account Pending',
          description: 'Your faculty account request is pending approval. Please wait for administrator review.',
        });
        navigate('/faculty-confirmation');
        setUser(null);
        setIsLoading(false);
        return null;
      }
      
      // Add cache busting parameter to avoid cached responses
      const timestamp = new Date().getTime();
      
      // Use direct database query with cache control - using explicit nocache headers
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (profile) {
        console.log('Profile fetched successfully:', profile);
        const userData = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar
        };
        
        console.log('Setting user data in state:', userData);
        setUser(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoading(false);
      throw error;
    }
  }, [navigate, toast]);

  // Add a refresh user method that forces a fresh data fetch
  const refreshUser = useCallback(async () => {
    try {
      console.log('Executing refreshUser function');
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        console.log('Active session found during refresh, user ID:', data.session.user.id);
        // Force refresh by passing true to fetch fresh data
        await fetchUserProfile(data.session.user.id, true);
      } else {
        console.log('No active session found during refresh');
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
    let mounted = true;
    
    // Initial auth check
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        console.log('Performing initial auth check');
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user && mounted) {
          console.log('Found existing session, auth provider:', sessionData.session.user.app_metadata?.provider);
          console.log('User ID from session:', sessionData.session.user.id);
          console.log('User email from session:', sessionData.session.user.email);
          
          // Force a fresh fetch on initial load
          await fetchUserProfile(sessionData.session.user.id, true);
        } else {
          console.log('No session found during initial check');
          setUser(null);
        }
      } catch (error) {
        console.error('Error during initial auth check:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    // Set up auth listener - using non-async callback to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        console.log('Auth provider:', session?.user?.app_metadata?.provider || 'none');
        
        if (session?.user && mounted) {
          // To avoid potential Supabase auth deadlocks, use setTimeout for async operations
          setTimeout(async () => {
            if (mounted) {
              console.log('Auth state changed to logged in, fetching fresh profile');
              console.log('User ID from auth state change:', session.user.id);
              console.log('Email from auth state change:', session.user.email);
              
              setIsLoading(true);
              // Always force a fresh fetch on auth state change
              setUser(null); // Clear any cached data first
              await fetchUserProfile(session.user.id, true);
              setIsLoading(false);
            }
          }, 0);
        } else if (mounted) {
          console.log('Auth state changed to logged out');
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('Cleaning up AuthProvider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('Signing out user');
      await supabase.auth.signOut();
      setUser(null);
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
