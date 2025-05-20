
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { User, UserRole } from '@/lib/types';

export function useAuthProvider() {
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
      
      const userEmail = authUser.user.email;
      const isNeuEmail = userEmail ? userEmail.toLowerCase().endsWith('@neu.edu.ph') : false;
      
      // Check if this is a Google sign-in that needs auto-approval
      if (isNeuEmail && authUser.user.app_metadata?.provider === 'google') {
        console.log('NEU domain Google sign-in detected, ensuring approval status');
        
        // Check if faculty request exists
        const { data: existingRequest } = await supabase
          .from('faculty_requests')
          .select('status')
          .eq('user_id', userId)
          .maybeSingle();
          
        // If not exists or not approved, create/update an approved entry for NEU Google users
        if (!existingRequest || existingRequest.status !== 'approved') {
          console.log('Creating or updating auto-approved status for NEU Google user');
          const { error: upsertError } = await supabase
            .from('faculty_requests')
            .upsert({
              user_id: userId,
              name: authUser.user.user_metadata?.full_name || 'NEU Student',
              email: userEmail,
              department: 'Student',
              status: 'approved'
            }, { onConflict: 'user_id' });
            
          if (upsertError) {
            console.error('Error auto-approving NEU Google user:', upsertError);
          }
          
          // Also update the user profile to ensure role is set
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: authUser.user.user_metadata?.full_name || 'NEU Student',
              email: userEmail,
              role: 'student' // Default role for Google NEU users
            }, { onConflict: 'id' });
            
          if (profileError) {
            console.error('Error updating profile for NEU Google user:', profileError);
          }
        }
      }
      
      // FACULTY_REQUESTS APPROVAL STATUS CHECK
      // Skip strict faculty_request approval for NEU emails
      if (!isNeuEmail) {
        const { data: facultyRequest, error: facultyError } = await supabase
          .from('faculty_requests')
          .select('status, department')
          .eq('user_id', userId)
          .maybeSingle();

        if (facultyError) {
          console.error('Error checking approval status:', facultyError);
          // Critical error - sign out and force login page
          await supabase.auth.signOut();
          toast({
            title: 'Authentication Error',
            description: 'Error verifying account status. Please try again.',
            variant: 'destructive'
          });
          navigate('/login');
          setUser(null);
          setIsLoading(false);
          return null;
        }
        
        // Only check non-NEU emails for approval status
        if (!isNeuEmail && (!facultyRequest || 
            facultyRequest.status === 'rejected' || 
            facultyRequest.status === 'pending')) {
          
          const statusMessage = !facultyRequest ? 'not found' : facultyRequest.status;
          console.log(`Access denied: account status is ${statusMessage}, signing out immediately`);
          
          await supabase.auth.signOut();
          
          const message = !facultyRequest ? 'Your account requires approval.' :
                          facultyRequest.status === 'rejected' ? 
                            'Your account has been rejected. Please contact administration.' :
                            'Your account registration is pending approval. Please wait for administrator review.';
          
          toast({
            title: facultyRequest?.status === 'rejected' ? 'Access Denied' : 'Account Pending Approval',
            description: message,
            variant: facultyRequest?.status === 'rejected' ? 'destructive' : 'default'
          });
          
          navigate('/login');
          
          setUser(null);
          setIsLoading(false);
          return null;
        }
      }

      console.log('User approval verified or NEU email detected, fetching profile data');
      
      // If user passed approval check, proceed with profile fetching
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
        
        // Build the user data with the necessary fields
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar,
          status: 'approved' // Default to approved for NEU users
        };
        
        // For non-NEU emails, double check status
        if (!isNeuEmail) {
          const { data: facultyRequest } = await supabase
            .from('faculty_requests')
            .select('status')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (facultyRequest) {
            userData.status = facultyRequest.status;
          }
            
          // STRICT ENFORCEMENT: Double-check status one more time for non-NEU emails
          if (userData.status !== 'approved') {
            console.log(`User access denied: account status is ${userData.status}`);
            await supabase.auth.signOut();
            
            const message = userData.status === 'rejected' ? 
              'Your account has been rejected. Please contact administration.' :
              'Your account registration is pending approval. Please wait for administrator review.';
              
            toast({
              title: userData.status === 'rejected' ? 'Access Denied' : 'Account Pending Approval',
              description: message,
              variant: userData.status === 'rejected' ? 'destructive' : 'default'
            });
            
            navigate('/login');
            
            setUser(null);
            setIsLoading(false);
            return null;
          }
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

  // Handle sign out functionality
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
        setUser(null);
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

  return {
    user,
    isLoading,
    signOut,
    refreshUser
  };
}
