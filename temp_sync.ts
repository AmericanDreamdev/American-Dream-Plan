/**
 * Sincroniza pagamento do American Dream com o 323 Network
 * 
 * Esta funÃ§Ã£o envia informaÃ§Ãµes de pagamento para o 323 Network
 * quando um pagamento Ã© confirmado no American Dream.
 */

interface SyncPaymentPayload {
  user_id: string; // UUID do usuÃ¡rio no 323 Network (lead.user_id)
  payment_id: string; // ID do pagamento no American Dream
  lead_id?: string; // ID do lead no American Dream
  amount: number; // Valor em centavos (ex: 10000 = $100.00)
  currency?: string; // 'USD' ou 'BRL' (padrÃ£o: 'USD')
  payment_method: 'card' | 'pix' | 'zelle';
  status: 'completed' | 'pending' | 'failed';
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  metadata?: Record<string, any>;
}

export async function syncPaymentTo323Network(payload: SyncPaymentPayload) {
  const SUPABASE_323_NETWORK_URL = Deno.env.get('SUPABASE_323_NETWORK_URL') || 
    'https://pgdvbanwumqjmqeybqnw.supabase.co';
  
  const API_KEY = Deno.env.get('AMERICAN_DREAM_SHARED_API_KEY');
  
  if (!API_KEY) {
    console.error('âŒ AMERICAN_DREAM_SHARED_API_KEY not configured');
    throw new Error('AMERICAN_DREAM_SHARED_API_KEY not configured');
  }

  try {
    console.log('ðŸ”„ Syncing payment to 323 Network:', {
      user_id: payload.user_id,
      payment_id: payload.payment_id,
      amount: payload.amount,
      currency: payload.currency,
      payment_method: payload.payment_method,
    });

    const response = await fetch(
      `${SUPABASE_323_NETWORK_URL}/functions/v1/sync-american-dream-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('âŒ Error syncing payment:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      throw new Error(`Failed to sync payment: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('âœ… Payment synced successfully to 323 Network:', result);
    return result;
  } catch (error: any) {
    console.error('âŒ Error syncing payment to 323 Network:', error);
    // NÃ£o falhar o fluxo principal se a sincronizaÃ§Ã£o falhar
    // Apenas logar o erro para debug
    throw error;
  }
}


