import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@^2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  lead_id: string;
  term_acceptance_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead_id, term_acceptance_id }: RequestBody = await req.json();

    if (!lead_id || !term_acceptance_id) {
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get term acceptance data
    const { data: termAcceptance, error: termError } = await supabase
      .from("term_acceptance")
      .select("*")
      .eq("id", term_acceptance_id)
      .single();

    if (termError || !termAcceptance) {
      console.error("Error fetching term acceptance:", termError);
      return new Response(
        JSON.stringify({ error: "Term acceptance not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get term content
    const { data: termData, error: termDataError } = await supabase
      .from("application_terms")
      .select("title, content")
      .eq("id", termAcceptance.term_id)
      .single();

    if (termDataError || !termData) {
      console.error("Error fetching term data:", termDataError);
      return new Response(
        JSON.stringify({ error: "Term not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Helper function to add wrapped text
    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 12
    ): number => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(lines[i], x, y);
        y += fontSize * 0.6;
      }
      return y;
    };

    // PDF Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("DOCUMENTO DE ACEITAÇÃO DE TERMOS", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 15;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "American Dream Consultoria",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 20;

    // Separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Informações do Contratante
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("INFORMAÇÕES DO CONTRATANTE", margin, currentY);
    currentY += 12;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    // Nome
    pdf.setFont("helvetica", "bold");
    pdf.text("Nome:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.name, margin + 30, currentY);
    currentY += 8;

    // Email
    pdf.setFont("helvetica", "bold");
    pdf.text("E-mail:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.email, margin + 30, currentY);
    currentY += 8;

    // Telefone
    pdf.setFont("helvetica", "bold");
    pdf.text("Telefone:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.phone, margin + 30, currentY);
    currentY += 8;

    currentY += 20;

    // Conteúdo do Contrato
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONTEÚDO DO CONTRATO", margin, currentY);
    currentY += 12;

    // Remove HTML tags from content for PDF (simple approach)
    const textContent = termData.content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    currentY = addWrappedText(
      textContent,
      margin,
      currentY,
      pageWidth - margin * 2,
      10
    );
    currentY += 20;

    // Detalhes da Aceitação (movido para o final, como assinatura)
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("DETALHES DA ACEITAÇÃO", margin, currentY);
    currentY += 15;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");

    // Título do Termo
    pdf.setFont("helvetica", "bold");
    pdf.text("Título do Termo:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    currentY = addWrappedText(
      termData.title,
      margin + 55,
      currentY,
      pageWidth - margin - 55,
      11
    );
    currentY += 5;

    // Data de Aceitação
    pdf.setFont("helvetica", "bold");
    pdf.text("Aceito em:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    const acceptanceDate = new Date(termAcceptance.accepted_at);
    pdf.text(
      acceptanceDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      margin + 55,
      currentY
    );
    currentY += 8;

    // Endereço IP
    pdf.setFont("helvetica", "bold");
    pdf.text("Endereço IP:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(termAcceptance.ip_address || "N/A", margin + 55, currentY);
    currentY += 8;

    // Navegador/Dispositivo
    pdf.setFont("helvetica", "bold");
    pdf.text("Navegador/Dispositivo:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    currentY = addWrappedText(
      termAcceptance.user_agent || "N/A",
      margin + 65,
      currentY,
      pageWidth - margin - 65,
      10
    );
    currentY += 15;

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      const footerDate = new Date();
      pdf.text(
        `Gerado em ${footerDate.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      pdf.text(
        "Este documento possui validade legal e serve como comprovante de aceitação",
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 5,
        { align: "center" }
      );
    }

    // Generate PDF blob
    const pdfBlob = pdf.output("blob");
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    // Upload to Storage - usar nome da pessoa no nome do arquivo
    // Normalizar nome para criar nome de arquivo seguro
    // Remove acentos e caracteres especiais
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    
    const normalizedName = lead.name
      .toLowerCase()
      .replace(/[àáâãäå]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ç]/g, "c")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais (mantém espaços temporariamente)
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-|-$/g, "") // Remove hífens no início/fim
      .substring(0, 50); // Limita o tamanho
    
    const fileName = `${normalizedName}_${dateStr}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("contracts").getPublicUrl(fileName);

    // Update term_acceptance with PDF URL
    const { error: updateError } = await supabase
      .from("term_acceptance")
      .update({ pdf_url: publicUrl })
      .eq("id", term_acceptance_id);

    if (updateError) {
      console.error("Error updating term acceptance:", updateError);
      // Don't fail the request if update fails, PDF is already uploaded
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: publicUrl,
        file_name: fileName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

