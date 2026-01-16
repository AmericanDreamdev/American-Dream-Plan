/**
 * Utilitários para decodificar e validar tokens JWT do 323 Network
 */

/**
 * Decodifica um JWT sem validar (apenas para obter os dados)
 * @param token - Token JWT
 * @returns Payload decodificado ou null se inválido
 */
export function decodeJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar o payload (segunda parte)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('[JWT] Erro ao decodificar token:', error);
    return null;
  }
}

/**
 * Extrai informações do usuário do token JWT do 323 Network
 * @param token - Token JWT do 323 Network
 * @returns Dados do usuário ou null
 */
export function extractUserFrom323Token(token: string): {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  phoneCountryCode?: string;
} | null {
  const decoded = decodeJWT(token);
  if (!decoded) {
    return null;
  }

  // Extrair dados do user_metadata ou do payload direto
  const userMetadata = decoded.user_metadata || {};
  const appMetadata = decoded.app_metadata || {};

  return {
    userId: decoded.sub || decoded.user_id,
    email: decoded.email || userMetadata.email,
    name: userMetadata.name || userMetadata.nome || decoded.name,
    phone: userMetadata.phone || decoded.phone,
    phoneCountryCode: userMetadata.phoneCountryCode || userMetadata.phone_country_code,
  };
}

