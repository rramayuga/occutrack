
import { supabase } from '@/integrations/supabase/client';

export const handleStudentRegistration = async (
  email: string,
  password: string,
  name: string
) => {
  // Create a pending registration request instead of direct signup
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student',
        status: 'pending'
      }
    }
  });

  if (signUpError) throw signUpError;
  
  // If it's not a student with an education domain, create a pending request
  if (!email.endsWith('@neu.edu.ph')) {
    if (data.user) {
      const { error: requestError } = await supabase
        .from('faculty_requests')
        .insert({
          user_id: data.user.id,
          name,
          email,
          department: 'Student',
          status: 'pending'
        });

      if (requestError) throw requestError;
    }
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
        role: 'faculty'
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
  // Ensure Google auth only allows NEU domain
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
    
    // First check if the user has a rejected faculty request
    // This critical check must be done BEFORE attempting to log in
    const { data: facultyRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('email', email)
      .maybeSingle();

    console.log('Faculty request status check result:', facultyRequest);
    
    // Block login for rejected users (regardless of email domain)
    if (facultyRequest && facultyRequest.status === 'rejected') {
      console.error('Login blocked: Account has been rejected');
      throw new Error('Your account has been rejected. Please contact administration for more information.');
    }

    if (facultyRequest && facultyRequest.status === 'pending') {
      console.error('Login blocked: Account pending approval');
      throw new Error('Your account registration is pending approval. Please wait for administrator review.');
    }

    // Only attempt login if the account is not rejected or pending
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
