
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';

export const handleStudentRegistration = async (
  email: string,
  password: string,
  name: string
) => {
  const { user, session, error: signUpError } = await supabase.auth.signUp({
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
  return { user, session };
};

export const handleFacultyRegistration = async (
  email: string,
  password: string,
  name: string,
  department: string
) => {
  const { user, session, error: signUpError } = await supabase.auth.signUp({
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

  if (user) {
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: user.id,
        name,
        email,
        department,
        status: 'pending'
      });

    if (requestError) throw requestError;
  }

  return { user, session };
};

export const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
  return data;
};
