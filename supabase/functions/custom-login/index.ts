import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check if it's an admin user
    const { data: adminData, error: adminError } = await supabase
      .from('administradores')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (adminData && !adminError) {
      // Verify admin password (simple comparison for now)
      // In production, you should use proper password hashing
      const isValidPassword = password === 'Src_Control@2025';
      
      if (isValidPassword) {
        // Create a custom session for admin
        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: adminData.id,
              username: adminData.username,
              type: 'admin'
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Check if it's a regular user
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (userData && !userError) {
      // For simplicity, we'll do a direct password comparison
      // In production, you should use proper password hashing verification
      const isValidPassword = password === userData.password;
      
      if (isValidPassword) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: userData.id,
              username: userData.username,
              type: 'user'
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Invalid credentials
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { 
        status: 401, 
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