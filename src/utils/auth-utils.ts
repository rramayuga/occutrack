
import { supabase } from '@/integrations/supabase/client';

export const handleStudentRegistration = async (
  email: string,
  password: string,
  name: string
) => {
  // ALL registrations now require approval, regardless of email domain
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student',
        status: 'pending'  // All registrations are pending by default
      }
    }
  });

  if (signUpError) throw signUpError;
  
  // Create a pending request for ALL users
  if (data.user) {
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: data.user.id,
        name,
        email,
        department: email.endsWith('@neu.edu.ph') ? 'NEU Student' : 'External User',
        status: 'pending'
      });

    if (requestError) throw requestError;
  }

  return { user: data.user, session: data.session };
};

export const handleFacultyRegistration = async (
  email: string,
  password: string,
  name: string,
  department: string
) => {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'faculty', // Set as faculty from the beginning
        status: 'pending'
      }
    }
  });

  if (signUpError) throw signUpError;

  if (data.user) {
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: data.user.id,
        name,
        email,
        department,
        status: 'pending'
      });

    if (requestError) throw requestError;
  }

  return { user: data.user, session: data.session };
};

export const handleGoogleSignIn = async () => {
  // Google auth continues to allow NEU domain
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        hd: 'neu.edu.ph' // Restrict to NEU domain emails only
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const handleLogin = async (email: string, password: string) => {
  try {
    console.log('Attempting login for:', email);
    
    // CRITICAL: First check if the user has a faculty_requests entry and verify approval status
    const { data: facultyRequest, error: requestError } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('email', email)
      .maybeSingle();
    
    if (requestError) {
      console.error('Error checking approval status:', requestError);
      throw new Error('Error verifying account status. Please try again later.');
    }

    // Block login for any user without an approval entry or with rejected/pending status
    if (!facultyRequest) {
      console.error('Login blocked: No approval record found');
      throw new Error('Your account requires approval. Please contact administration.');
    }
    
    if (facultyRequest.status === 'rejected') {
      console.error('Login blocked: Account has been rejected');
      throw new Error('Your account has been rejected. Please contact administration for more information.');
    }

    if (facultyRequest.status === 'pending') {
      console.error('Login blocked: Account pending approval');
      throw new Error('Your account registration is pending approval. Please wait for administrator review.');
    }
    
    // ONLY PROCEED with login if status is explicitly 'approved'
    if (facultyRequest.status !== 'approved') {
      console.error('Login blocked: Account not approved');
      throw new Error('Your account does not have the required approval status to log in.');
    }

    console.log('User approval status verified, proceeding with login attempt');

    // Attempt login only if the account is approved
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Authentication failed');
    }

    // Double-check approval status after authentication as an additional security measure
    const { data: userRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (userRequest) {
      if (userRequest.status !== 'approved') {
        // Force sign out if status is not approved
        await supabase.auth.signOut();
        throw new Error('Your account does not have proper approval to access this application.');
      }
    } else {
      // No faculty request found for authenticated user - this should not happen
      // Force sign out
      await supabase.auth.signOut();
      throw new Error('Account verification failed. Please contact administration.');
    }

    console.log('Login successful for user ID:', data.user.id);
    
    return { 
      user: data.user,
      session: data.session 
    };
  } catch (error: any) {
    console.error('Login process error:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    console.log('Deleting user with ID:', userId);
    
    // Call the delete-user function to handle complete user deletion
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error from delete-user function:', error);
      throw error;
    }
    
    console.log('User successfully deleted');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
