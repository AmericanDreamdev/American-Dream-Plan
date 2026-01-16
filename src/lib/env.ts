/**
 * Utilitários para detectar ambiente e construir URLs dinâmicas
 */

/**
 * Detecta se está em ambiente de desenvolvimento
 */
export const isDevelopment = (): boolean => {
  // Verificar se está rodando em localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      import.meta.env.MODE === 'development'
    );
  }
  return import.meta.env.MODE === 'development';
};

/**
 * Retorna a URL base do American Dream baseada no ambiente
 * IMPORTANTE: Esta função SEMPRE retorna a URL do American Dream, nunca do 323 Network
 * - PRIORIDADE 1: VITE_SITE_URL (se definida, sempre usa ela)
 * - Desenvolvimento: usa window.location.origin (detecta porta automaticamente) ou localhost:8080
 * - Produção: URL da variável de ambiente ou window.location.origin
 */
export const getSiteUrl = (): string => {
  // PRIORIDADE 1: Se houver variável de ambiente definida, usar ela (tem prioridade ABSOLUTA)
  const envSiteUrl = import.meta.env.VITE_SITE_URL;
  if (envSiteUrl && envSiteUrl.trim() !== '') {
    const url = envSiteUrl.trim();
    // Validar que não é a URL do 323 Network
    if (!url.includes('323network.com') && !url.includes('localhost:3000')) {
      return url;
    }
  }

  // Se estiver em desenvolvimento, usar a origem atual (detecta porta automaticamente)
  // Isso garante que sempre use a porta onde o American Dream está rodando
  if (isDevelopment()) {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Garantir que não está apontando para o 323 Network
      if (!origin.includes('323network.com') && !origin.includes(':3000')) {
        return origin;
      }
      // Se por algum motivo estiver no 323 Network, usar fallback
      return 'http://localhost:8080';
    }
    return 'http://localhost:8080';
  }

  // Em produção, usar a origem atual (mas validar que é do American Dream)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Se for do American Dream, usar
    if (origin.includes('americandream.323network.com')) {
      return origin;
    }
    // Se não for, usar fallback de produção
    return 'https://americandream.323network.com';
  }

  // Fallback de produção
  return 'https://americandream.323network.com';
};

/**
 * Retorna a URL do 323 Network baseada no ambiente
 * - PRIORIDADE 1: VITE_323_NETWORK_URL (se definida, sempre usa ela)
 * - Desenvolvimento: localhost:3000 (ou porta definida em VITE_323_NETWORK_DEV_PORT)
 * - Produção: https://323network.com
 */
export const get323NetworkUrl = (): string => {
  // PRIORIDADE 1: Se houver variável de ambiente definida, usar ela (tem prioridade ABSOLUTA)
  const env323Url = import.meta.env.VITE_323_NETWORK_URL;
  if (env323Url && env323Url.trim() !== '') {
    return env323Url.trim();
  }

  // Se estiver em desenvolvimento, usar localhost
  if (isDevelopment()) {
    const devPort = import.meta.env.VITE_323_NETWORK_DEV_PORT || '3000';
    return `http://localhost:${devPort}`;
  }

  // Em produção, usar a URL de produção
  return 'https://323network.com';
};

/**
 * Constrói a URL de callback para autenticação
 * @param path - Caminho do callback (padrão: /auth/callback)
 * @param params - Parâmetros de query string opcionais
 */
export const buildCallbackUrl = (
  path: string = '/auth/callback',
  params?: Record<string, string>
): string => {
  const siteUrl = getSiteUrl();
  const callbackUrl = new URL(path, siteUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      callbackUrl.searchParams.set(key, value);
    });
  }
  
  return callbackUrl.toString();
};

