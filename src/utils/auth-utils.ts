
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

    // Check if the user is a rejected faculty member
    const { data: facultyRequest } = await supabase
      .from('faculty_requests')
      .select('status')
      .eq('user_id', data.user.id)
      .eq('status', 'rejected')
      .maybeSingle();

    if (facultyRequest && facultyRequest.status === 'rejected') {
      // Immediately sign the user out
      await supabase.auth.signOut();
      throw new Error('Your faculty account request has been rejected. Please contact administration.');
    }

    // Fetch the user's profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Instead of failing immediately, we'll return the basic user data
      // and let the AuthProvider handle fetching the profile
      return { 
        user: data.user,
        session: data.session 
      };
    }

    if (profile) {
      return { 
        user: {
          ...data.user,
          role: profile.role,
          name: profile.name,
        },
        session: data.session 
      };
    }

    // Return basic user data if profile not found
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Error in handleLogin:', error);
    throw error;
  }
};
