import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type TermType = "lead_contract";

interface ClientInfo {
  ip_address: string | null;
  user_agent: string;
}

export const useTermsAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's IP address and user agent
  const getClientInfo = useCallback(async (): Promise<ClientInfo> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return {
        ip_address: data.ip,
        user_agent: navigator.userAgent,
      };
    } catch (error) {
      console.warn("Could not get IP address:", error);
      return {
        ip_address: null,
        user_agent: navigator.userAgent,
      };
    }
  }, []);

  // Record term acceptance
  const recordTermAcceptance = useCallback(
    async (
      leadId: string,
      termId: string,
      termType: TermType = "lead_contract"
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const clientInfo = await getClientInfo();

        const { data, error: rpcError } = await supabase.rpc(
          "record_term_acceptance",
          {
            p_lead_id: leadId,
            p_term_id: termId,
            p_term_type: termType,
            p_ip_address: clientInfo.ip_address,
            p_user_agent: clientInfo.user_agent,
          }
        );

        if (rpcError) throw rpcError;

        const acceptanceId = data || null;
        return acceptanceId;
      } catch (error: any) {
        console.error("Error recording term acceptance:", error);
        setError(error.message || "Failed to record term acceptance");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getClientInfo]
  );

  return {
    recordTermAcceptance,
    loading,
    error,
  };
};

