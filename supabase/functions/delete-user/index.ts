
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Create a Supabase client with the Admin key
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    const { userId } = await req.json();
    
    console.log(`Received request to delete user with ID: ${userId}`);
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .auth.admin.getUserById(userId);
      
    if (userError || !userData.user) {
      console.error(`Error fetching user or user not found: ${userError?.message}`);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is using Google provider
    const isGoogleUser = userData.user?.app_metadata?.provider === 'google';
    const userEmail = userData.user?.email;
    
    console.log(`User provider: ${userData.user?.app_metadata?.provider}, Email: ${userEmail}`);
    
    if (isGoogleUser && userEmail?.endsWith('@neu.edu.ph')) {
      console.log("This is a NEU Google account - will only revoke faculty status instead of deletion");
      
      // Update the user's role to 'student' instead of deleting
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', userId);
        
      if (updateError) {
        console.error(`Error updating user role: ${updateError.message}`);
        return new Response(
          JSON.stringify({ error: "Failed to update user role" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User role updated to student", 
          preserved: true 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Delete the user's related data first to preserve referential integrity
    console.log("Deleting user's related data...");
    
    // 1. Delete faculty requests if exists
    const { error: facultyRequestError } = await supabase
      .from('faculty_requests')
      .delete()
      .eq('user_id', userId);
      
    if (facultyRequestError) {
      console.log(`Note: No faculty request found or error: ${facultyRequestError.message}`);
      // Continue with deletion even if this fails
    }
    
    // 2. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error(`Error deleting user profile: ${profileError.message}`);
      // Continue with deletion even if this fails
    }
    
    // 3. Delete any room reservations (if they exist)
    const { error: reservationError } = await supabase
      .from('room_reservations')
      .delete()
      .eq('faculty_id', userId);
      
    if (reservationError) {
      console.log(`Note: No reservations found or error: ${reservationError.message}`);
      // Continue with deletion even if this fails
    }

    // Finally, delete the user from auth.users
    console.log("Deleting user from auth system...");
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error(`Error deleting user: ${deleteError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log("User successfully deleted");
    return new Response(
      JSON.stringify({ success: true, message: "User successfully deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
