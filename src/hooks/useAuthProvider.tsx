
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

  // Create a function to ensure NEU users are automatically approved
  const ensureNeuUserApproval = useCallback(async (userId: string, email: string) => {
    try {
      // Only process if this is a NEU email
      if (email.toLowerCase().endsWith('@neu.edu.ph')) {
        console.log('Processing NEU email automatic approval:', email);
        
        // Check if user has a faculty_request entry
        const { data: existingRequest } = await supabase
          .from('faculty_requests')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (existingRequest) {
          // If request exists but status is not approved, update it
          if (existingRequest.status !== 'approved') {
            await supabase
              .from('faculty_requests')
              .update({ status: 'approved' })
              .eq('user_id', userId);
              
            console.log('Updated existing NEU user to approved status');
          }
        } else {
          // Create an approved request for the NEU user
          await supabase
            .from('faculty_requests')
            .insert({
              user_id: userId,
              name: email.split('@')[0], // Basic name from email
              email: email,
              department: 'Student', // Default department
              status: 'approved'
            });
            
          console.log('Created new approved entry for NEU user');
        }
        
        // Update user's role in profiles table if not already set
        await supabase
          .from('profiles')
          .update({ 
            role: 'student',
            status: 'approved'
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error ensuring NEU user approval:', error);
    }
  }, []);

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
      
      // Handle automatic approval for NEU domain users
      if (authUser.user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
        await ensureNeuUserApproval(userId, authUser.user.email);
      }
      
      // STRICT ENFORCEMENT: First check faculty_requests approval status
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
      
      // Auto-create approval for NEU domain users if none exists
      if (!facultyRequest && authUser.user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
        console.log('Creating automatic approval for NEU domain user');
        const { error: insertError } = await supabase
          .from('faculty_requests')
          .insert({
            user_id: userId,
            name: authUser.user.user_metadata?.name || authUser.user.email.split('@')[0],
            email: authUser.user.email,
            department: 'Student',
            status: 'approved'
          });
          
        if (insertError) {
          console.error('Error creating automatic approval:', insertError);
        } else {
          // Refetch faculty request after insertion
          const { data: newFacultyRequest } = await supabase
            .from('faculty_requests')
            .select('status, department')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (newFacultyRequest) {
            console.log('Successfully created automatic approval for NEU user');
          }
        }
      }
      
      // Recheck faculty request (may have been just created for NEU users)
      const { data: checkFacultyRequest } = await supabase
        .from('faculty_requests')
        .select('status, department')
        .eq('user_id', userId)
        .maybeSingle();
      
      // CRITICAL: Block access if user is not approved
      // Note: We check for both null/undefined and explicit status values
      // Don't block NEU domain users
      if ((!checkFacultyRequest || 
          (checkFacultyRequest.status === 'rejected' || 
           checkFacultyRequest.status === 'pending')) && 
          !authUser.user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
        
        const statusMessage = !checkFacultyRequest ? 'not found' : checkFacultyRequest.status;
        console.log(`Access denied: account status is ${statusMessage}, signing out immediately`);
        
        await supabase.auth.signOut();
        
        const message = !checkFacultyRequest ? 'Your account requires approval.' :
                        checkFacultyRequest.status === 'rejected' ? 
                          'Your account has been rejected. Please contact administration.' :
                          'Your account registration is pending approval. Please wait for administrator review.';
        
        toast({
          title: checkFacultyRequest?.status === 'rejected' ? 'Access Denied' : 'Account Pending Approval',
          description: message,
          variant: checkFacultyRequest?.status === 'rejected' ? 'destructive' : 'default'
        });
        
        navigate('/login');
        
        setUser(null);
        setIsLoading(false);
        return null;
      }

      console.log('User approval verified or NEU email automatically approved, fetching profile data');
      
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
        
        // Set the faculty request status (if it exists) or 'approved' for NEU users
        const statusToUse = checkFacultyRequest?.status || 
                           (authUser.user.email?.toLowerCase().endsWith('@neu.edu.ph') ? 'approved' : 'pending');
        
        // Build the user data with the necessary fields
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          avatarUrl: profile.avatar,
          status: statusToUse // Include status from faculty_requests
        };
        
        // STRICT ENFORCEMENT: Double-check status one more time for non-NEU users
        if (userData.status !== 'approved' && !authUser.user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
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
        
        setUser(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoading(false);
      throw error;
    }
  }, [navigate, toast, ensureNeuUserApproval]);

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
              
              // Auto-approve NEU email users from Google sign-in
              if (session.user.app_metadata?.provider === 'google' && 
                  session.user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
                console.log('Google sign-in with NEU email detected, ensuring approval');
                await ensureNeuUserApproval(session.user.id, session.user.email);
              }
              
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
  }, [fetchUserProfile, ensureNeuUserApproval]);

  return {
    user,
    isLoading,
    signOut,
    refreshUser
  };
}
