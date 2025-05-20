
import { supabase } from '@/integrations/supabase/client';

export const handleStudentRegistration = async (
  email: string,
  password: string,
  name: string
) => {
  // Check if email has NEU domain
  if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
    throw new Error('Only emails with @neu.edu.ph domain are allowed to register.');
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student',
        status: 'approved'  // Auto-approve NEU domain emails
      }
    }
  });

  if (signUpError) throw signUpError;
  
  // Create a pre-approved request for NEU emails
  if (data.user) {
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: data.user.id,
        name,
        email,
        department: 'NEU Domain',
        status: 'approved'  // Auto-approve
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
  // Check if email has NEU domain
  if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
    throw new Error('Only emails with @neu.edu.ph domain are allowed to register.');
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student', // Start as student until approved as faculty
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
  // Only allow Google auth with NEU domain
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
    
    // Check if email has NEU domain
    if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
      throw new Error('Only emails with @neu.edu.ph domain are allowed to login.');
    }
    
    // Check approval status for faculty account requests
    const { data: facultyRequest, error: requestError } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('email', email)
      .maybeSingle();
    
    if (requestError) {
      console.error('Error checking approval status:', requestError);
      throw new Error('Error verifying account status. Please try again later.');
    }

    // For faculty requests, enforce status checks
    if (facultyRequest && facultyRequest.status === 'rejected') {
      console.error('Login blocked: Account has been rejected');
      throw new Error('Your account has been rejected. Please contact administration for more information.');
    }

    if (facultyRequest && facultyRequest.status === 'pending') {
      console.error('Login blocked: Account pending approval');
      throw new Error('Your faculty account registration is pending approval. Please wait for administrator review.');
    }

    console.log('User verification passed, proceeding with login attempt');

    // Attempt login
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

    // Double-check user status
    const { data: userRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    
    if (userRequest) {
      if (userRequest.status === 'rejected') {
        // Force sign out if status is rejected
        await supabase.auth.signOut();
        throw new Error('Your account has been rejected. Please contact administration.');
      }

      if (userRequest.status === 'pending' && data.user.user_metadata.role === 'faculty') {
        // Allow students with pending faculty request to log in as students
        await supabase.auth.signOut();
        throw new Error('Your faculty account registration is pending approval.');
      }
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
