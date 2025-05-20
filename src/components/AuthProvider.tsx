
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

  // Create a reusable function to fetch user profile with force refresh option
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      console.log('Fetching user profile for ID:', userId, 'Force refresh:', forceRefresh);
      
      // Get the user's email from the auth session
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.log('No auth user found');
        return null;
      }
      
      // Check for pending/rejected status first - CRITICAL CHECK
      const { data: facultyRequest, error: facultyError } = await supabase
        .from('faculty_requests')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (facultyError) {
        console.error('Error checking approval status:', facultyError);
      }
      
      // STRICT ENFORCEMENT: If the user has been rejected or is pending, sign them out immediately
      if (facultyRequest && (facultyRequest.status === 'rejected' || facultyRequest.status === 'pending')) {
        console.log(`User access denied: account is ${facultyRequest.status}, signing out immediately`);
        await supabase.auth.signOut();
        
        const message = facultyRequest.status === 'rejected' 
          ? 'Your account has been rejected. Please contact administration for more information.'
          : 'Your account registration is pending approval. Please wait for administrator review.';
          
        toast({
          title: facultyRequest.status === 'rejected' ? 'Access Denied' : 'Account Pending Approval',
          description: message,
          variant: facultyRequest.status === 'rejected' ? 'destructive' : 'default'
        });
        
        if (facultyRequest.status === 'pending') {
          navigate('/faculty-confirmation');
        } else {
          navigate('/login');
        }
        
        setUser(null);
        setIsLoading(false);
        return null;
      }

      // If user passed rejection/pending checks, proceed with profile fetching
      console.log('User passed status checks, fetching profile data');
      
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
        console.log('Profile fetched successfully:', profile);
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar
        };
        
        // If status property exists in the profile, add it to userData
        if (profile && Object.prototype.hasOwnProperty.call(profile, 'status')) {
          (userData as User).status = profile.status as string;
        }
        
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
          
          // Initial fetch of user profile
          await fetchUserProfile(sessionData.session.user.id);
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
        
        if (session?.user && mounted) {
          // To avoid potential Supabase auth deadlocks, use setTimeout for async operations
          setTimeout(async () => {
            if (mounted) {
              console.log('Auth state changed to logged in, fetching profile');
              console.log('User ID from auth state change:', session.user.id);
              
              await fetchUserProfile(session.user.id);
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
