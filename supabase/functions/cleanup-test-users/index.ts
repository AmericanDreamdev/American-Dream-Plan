import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Buscar leads com 'uorak'
        const { data: leads, error: searchError } = await supabase
            .from('leads')
            .select('id, email, user_id')
            .ilike('email', '%uorak%');

        if (searchError) throw searchError;

        const results = {
            found: leads.length,
            deleted_leads: 0,
            deleted_auth_users: 0,
            details: [] as string[]
        };

        // 2. Deletar cada um
        for (const lead of leads) {
            // Deletar usuário da autenticação se existir
            if (lead.user_id) {
                const { error: authDeleteError } = await supabase.auth.admin.deleteUser(lead.user_id);
                if (!authDeleteError) {
                    results.deleted_auth_users++;
                } else {
                    console.error(`Erro ao deletar auth user ${lead.user_id}:`, authDeleteError);
                }
            }

            // Deletar lead (caso não seja cascade ou para garantir)
            const { error: leadDeleteError } = await supabase
                .from('leads')
                .delete()
                .eq('id', lead.id);

            if (!leadDeleteError) {
                results.deleted_leads++;
                results.details.push(`Deletado: ${lead.email}`);
            } else {
                console.error(`Erro ao deletar lead ${lead.id}:`, leadDeleteError);
                results.details.push(`Falha ao deletar: ${lead.email}`);
            }
        }

        return new Response(
            JSON.stringify({ success: true, ...results }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
