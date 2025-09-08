import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Custom login function called:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();
    console.log('Login attempt for username:', username);

    if (!username || !password) {
      console.log('Missing username or password');
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service role key exists:', !!supabaseKey);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find user profile by username
    console.log('Looking for user profile with username:', username);
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, username, role')
      .eq('username', username)
      .maybeSingle();

    if (profileError) {
      console.log('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!profileData) {
      console.log('Profile not found for username:', username);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found profile:', profileData);

    // Get the user's email from auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileData.user_id);

    if (authError || !authUser.user) {
      console.log('Auth user error:', authError);
      console.log('Auth user not found for user_id:', profileData.user_id);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found auth user with email:', authUser.user.email);

    // Try to sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.user.email!,
      password: password,
    });

    if (signInError || !signInData.session) {
      console.log('Sign in failed:', signInError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Sign in successful for user:', profileData.username);

    // Return the session data with role information
    return new Response(
      JSON.stringify({ 
        session: signInData.session,
        user: {
          ...signInData.user,
          username: profileData.username,
          role: profileData.role,
          type: profileData.role === 'administrador' ? 'admin' :   
            profileData.role === 'cliente' ? 'client' : 'user'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});