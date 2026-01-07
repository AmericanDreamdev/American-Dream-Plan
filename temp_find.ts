/**
 * FunÃ§Ãµes helper para buscar usuÃ¡rios no 323 Network
 * 
 * Quando o user_id do American Dream nÃ£o corresponde ao user_id do 323 Network,
 * essas funÃ§Ãµes permitem buscar o usuÃ¡rio correto pelo email.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_323_NETWORK_URL = Deno.env.get('SUPABASE_323_NETWORK_URL') || 
  'https://pgdvbanwumqjmqeybqnw.supabase.co';
const SERVICE_ROLE_KEY_323_NETWORK = Deno.env.get('SERVICE_ROLE_KEY_323_NETWORK');

/**
 * Verifica se um usuÃ¡rio existe no 323 Network pelo user_id
 */
export async function userExistsIn323Network(userId: string): Promise<boolean> {
  if (!SERVICE_ROLE_KEY_323_NETWORK) {
    console.warn('âš ï¸ SERVICE_ROLE_KEY_323_NETWORK not configured - cannot verify user existence');
    return false;
  }

  try {
    const supabase323 = createClient(
      SUPABASE_323_NETWORK_URL,
      SERVICE_ROLE_KEY_323_NETWORK,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Tentar buscar o usuÃ¡rio pelo ID usando Admin API
    const { data: { user }, error } = await supabase323.auth.admin.getUserById(userId);
    
    if (error) {
      // Se der erro, provavelmente o usuÃ¡rio nÃ£o existe
      return false;
    }

    return user !== null && user !== undefined;
  } catch (error: any) {
    console.error('âŒ Error checking user existence in 323 Network:', error.message);
    return false;
  }
}

/**
 * Busca usuÃ¡rio no 323 Network pelo email usando Admin API
 * Retorna o user_id se encontrado, null caso contrÃ¡rio
 */
export async function findUserIn323NetworkByEmail(email: string): Promise<string | null> {
  if (!SERVICE_ROLE_KEY_323_NETWORK) {
    console.warn('âš ï¸ SERVICE_ROLE_KEY_323_NETWORK not configured - cannot search user by email');
    return null;
  }

  if (!email || email.trim() === '') {
    console.warn('âš ï¸ Email is empty - cannot search user');
    return null;
  }

  try {
    const supabase323 = createClient(
      SUPABASE_323_NETWORK_URL,
      SERVICE_ROLE_KEY_323_NETWORK,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar usuÃ¡rio pelo email usando Admin API
    const { data: { users }, error } = await supabase323.auth.admin.listUsers();
    
    if (error) {
      console.error('âŒ Error listing users in 323 Network:', error.message);
      return null;
    }

    // Buscar usuÃ¡rio com email correspondente (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email?.toLowerCase().trim() === normalizedEmail);
    
    if (user) {
      console.log(`âœ… Found user in 323 Network by email: ${email} -> ${user.id}`);
      return user.id;
    }

    console.warn(`âš ï¸ User with email ${email} not found in 323 Network`);
    return null;
  } catch (error: any) {
    console.error('âŒ Error finding user by email in 323 Network:', error.message);
    return null;
  }
}

/**
 * ObtÃ©m o user_id correto do 323 Network
 * Tenta usar o user_id do lead primeiro, se nÃ£o existir, busca pelo email
 */
export async function getCorrectUserIdFrom323Network(
  leadUserId: string | null | undefined,
  leadEmail: string
): Promise<string | null> {
  // Se nÃ£o tem user_id no lead, buscar direto pelo email
  if (!leadUserId) {
    console.log(`ðŸ“§ Lead has no user_id, searching by email: ${leadEmail}`);
    return await findUserIn323NetworkByEmail(leadEmail);
  }

  // Verificar se o user_id existe no 323 Network
  const exists = await userExistsIn323Network(leadUserId);
  
  if (exists) {
    console.log(`âœ… User ID ${leadUserId} exists in 323 Network`);
    return leadUserId;
  }

  // Se nÃ£o existe, buscar pelo email
  console.log(`âš ï¸ User ID ${leadUserId} not found in 323 Network. Searching by email: ${leadEmail}`);
  const userIdByEmail = await findUserIn323NetworkByEmail(leadEmail);
  
  if (userIdByEmail) {
    console.log(`âœ… Found user by email. Correct user_id: ${userIdByEmail} (was: ${leadUserId})`);
  }
  
  return userIdByEmail;
}


