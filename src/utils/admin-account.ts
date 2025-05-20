
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates an admin account with the specified credentials
 * This function is meant to be used for initial setup only
 */
export const createAdminAccount = async (email: string, password: string) => {
  try {
    // First check if the account already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      throw new Error(`Failed to check if user exists: ${checkError.message}`);
    }

    if (existingUser) {
      console.log('Admin user already exists, updating role if needed');
      
      // If user exists but is not an admin, update their role
      if (existingUser.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', existingUser.id);
          
        if (updateError) {
          console.error('Error updating user role:', updateError);
          throw new Error(`Failed to update user role: ${updateError.message}`);
        }
        
        return { success: true, message: 'User role updated to admin', user: existingUser };
      }
      
      return { success: true, message: 'Admin user already exists', user: existingUser };
    }

    // If user doesn't exist, create a new one with sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Administrator',
          role: 'admin',
          status: 'approved'
        }
      }
    });

    if (error) {
      console.error('Error creating admin account:', error);
      throw new Error(`Failed to create admin account: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('No user returned after signup');
    }

    // Ensure the faculty_requests entry exists with approved status
    const { error: requestError } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: data.user.id,
        name: 'Administrator',
        email,
        department: 'Administration',
        status: 'approved'
      });

    if (requestError) {
      console.error('Error creating faculty request:', requestError);
      throw new Error(`Failed to create faculty request: ${requestError.message}`);
    }

    console.log('Admin account created successfully:', data.user);
    return { success: true, message: 'Admin account created successfully', user: data.user };

  } catch (error: any) {
    console.error('Admin account creation failed:', error);
    return { success: false, message: error.message };
  }
};
