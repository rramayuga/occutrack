
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';

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
  return data;
};

export const handleFacultyRegistration = async (
  email: string,
  password: string,
  name: string,
  department: string
) => {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
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

  if (authData.user) {
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        department,
        status: 'pending'
      });

    if (requestError) throw requestError;
  }

  return authData;
};
