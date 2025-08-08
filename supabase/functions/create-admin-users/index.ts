import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@src.com',
      password: 'Src_Admin@2025',
      email_confirm: true
    });

    if (adminError) {
      console.error('Error creating admin user:', adminError);
    } else {
      console.log('Admin user created:', adminUser.user?.id);
      
      // Create admin profile
      await supabaseAdmin.from('user_profiles').insert({
        user_id: adminUser.user!.id,
        username: 'Admin_SRC',
        role: 'administrador',
        requires_password_change: false
      });
    }

    // Create agent user
    const { data: agentUser, error: agentError } = await supabaseAdmin.auth.admin.createUser({
      email: 'agente@src.com',
      password: 'Src_Control@2025',
      email_confirm: true
    });

    if (agentError) {
      console.error('Error creating agent user:', agentError);
    } else {
      console.log('Agent user created:', agentUser.user?.id);
      
      // Create agent profile
      await supabaseAdmin.from('user_profiles').insert({
        user_id: agentUser.user!.id,
        username: 'Src_Control',
        role: 'agente_seguridad',
        requires_password_change: false
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Users created successfully",
        admin: adminUser?.user?.id || null,
        agent: agentUser?.user?.id || null
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in create-admin-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});