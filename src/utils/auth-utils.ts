
import { supabase } from '@/integrations/supabase/client';

// Removed all email/password login functions and only kept Google auth

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

// Delete user utility function - completely removes non-Google accounts
// For NEU Google accounts (@neu.edu.ph), it only demotes to student role
export const deleteUser = async (userId: string) => {
  try {
    console.log('Handling user deletion/role change for ID:', userId);
    
    // Call the delete-user function to handle complete user deletion or role change
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error from delete-user function:', error);
      throw error;
    }
    
    console.log('User deletion/role change operation completed successfully');
    return true;
  } catch (error) {
    console.error('Error in user deletion/role change operation:', error);
    throw error;
  }
};
