
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const handleLogin = async (email: string, password: string) => {
  try {
    // First check if the user has been rejected
    const { data: facultyRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('email', email)
      .eq('status', 'rejected')
      .single();

    if (facultyRequest?.status === 'rejected') {
      throw new Error('Your faculty account request has been rejected. Please contact administration.');
    }

    // Check if the user has a pending request
    const { data: pendingRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (pendingRequest?.status === 'pending') {
      throw new Error('Your account registration is pending approval. Please wait for administrator review.');
    }

    // Proceed with login if not rejected or pending
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
    // First delete any faculty request
    const { error: facultyError } = await supabase
      .from('faculty_requests')
      .delete()
      .eq('user_id', userId);
    
    if (facultyError) {
      console.error('Error deleting faculty request:', facultyError);
    }
    
    // Then delete user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
