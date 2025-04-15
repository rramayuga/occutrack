import { supabase } from '@/integrations/supabase/client';

export const handleStudentRegistration = async (
  email: string,
  password: string,
  name: string
) => {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'student'
      }
    }
  });

  if (signUpError) throw signUpError;
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

    // Proceed with login if not rejected
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
