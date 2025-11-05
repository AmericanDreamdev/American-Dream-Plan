import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@^2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface RequestBody {
  lead_id: string;
  term_acceptance_id: string;
}

Deno.serve(async (req: Request) => {
  console.log("[PDF Generation] ========== FUNCTION CALLED ==========");
  console.log("[PDF Generation] Method:", req.method);
  console.log("[PDF Generation] URL:", req.url);
  console.log("[PDF Generation] Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[PDF Generation] CORS preflight request - returning OK");
    console.log("[PDF Generation] CORS headers:", JSON.stringify(corsHeaders));
    return new Response("ok", { headers: corsHeaders });
  }
  
  console.log("[PDF Generation] POST request received - processing...");

  try {
    console.log("[PDF Generation] Parsing request body...");
    const { lead_id, term_acceptance_id }: RequestBody = await req.json();
    console.log("[PDF Generation] Request params - lead_id:", lead_id, "term_acceptance_id:", term_acceptance_id);

    if (!lead_id || !term_acceptance_id) {
      console.error("[PDF Generation] Missing required parameters");
      return new Response(
        JSON.stringify({ error: "lead_id and term_acceptance_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    console.log("[PDF Generation] Initializing Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[PDF Generation] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("[PDF Generation] Supabase client initialized");

    // Get lead data
    console.log("[PDF Generation] Fetching lead data...");
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("[PDF Generation] Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[PDF Generation] Lead found:", lead.name, lead.email);

    // Get term acceptance data
    console.log("[PDF Generation] Fetching term acceptance data...");
    const { data: termAcceptance, error: termError } = await supabase
      .from("term_acceptance")
      .select("*")
      .eq("id", term_acceptance_id)
      .single();

    if (termError || !termAcceptance) {
      console.error("[PDF Generation] Error fetching term acceptance:", termError);
      return new Response(
        JSON.stringify({ error: "Term acceptance not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[PDF Generation] Term acceptance found, term_id:", termAcceptance.term_id);

    // Get term content
    console.log("[PDF Generation] Fetching term content...");
    const { data: termData, error: termDataError } = await supabase
      .from("application_terms")
      .select("title, content")
      .eq("id", termAcceptance.term_id)
      .single();

    if (termDataError || !termData) {
      console.error("[PDF Generation] Error fetching term data:", termDataError);
      return new Response(
        JSON.stringify({ error: "Term not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[PDF Generation] Term content found, title:", termData.title);
    console.log("[PDF Generation] Content length:", termData.content?.length || 0);

    // Generate PDF
    console.log("[PDF Generation] Starting PDF generation...");
    const pdf = new jsPDF();
    console.log("[PDF Generation] PDF object created");
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

    // PDF Header - Estrutura Original
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

    // Remove HTML tags from content for PDF and format properly
    console.log("[PDF Generation] Processing HTML content...");
    let textContent = termData.content
      .replace(/<h1[^>]*>/g, "\n\n")
      .replace(/<h2[^>]*>/g, "\n\n")
      .replace(/<\/h[12]>/g, "\n")
      .replace(/<p[^>]*>/g, "\n")
      .replace(/<\/p>/g, "\n")
      .replace(/<strong[^>]*>/g, "")
      .replace(/<\/strong>/g, "")
      .replace(/<ul[^>]*>/g, "\n")
      .replace(/<\/ul>/g, "\n")
      .replace(/<li[^>]*>/g, "  • ")
      .replace(/<\/li>/g, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n") // Remove múltiplas quebras de linha
      .trim();
    console.log("[PDF Generation] Text content processed, length:", textContent.length);

    // Conteúdo do Contrato
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONTEÚDO DO CONTRATO", margin, currentY);
    currentY += 12;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    console.log("[PDF Generation] Adding content to PDF...");
    currentY = addWrappedText(
      textContent,
      margin,
      currentY,
      pageWidth - margin * 2,
      10
    );
    currentY += 20;
    console.log("[PDF Generation] Content added to PDF");

    // Seção de Assinatura
    const acceptanceDate = new Date(termAcceptance.accepted_at);
    const day = acceptanceDate.getDate().toString().padStart(2, '0');
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = monthNames[acceptanceDate.getMonth()];
    const year = acceptanceDate.getFullYear();

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    currentY = addWrappedText(
      `Los Angeles, Califórnia, ${day} de ${month} de ${year}.`,
      margin,
      currentY,
      pageWidth - margin * 2,
      10
    );
    currentY += 20;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("⸻", pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("CONTRATANTE", margin, currentY);
    currentY += 12;

    // Assinatura com nome sublinhado
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Assinatura:", margin, currentY);
    
    // Calcular posição do nome
    const nameStartX = margin + pdf.getTextWidth("Assinatura: ") + 5;
    pdf.setFont("helvetica", "bold");
    pdf.text(lead.name, nameStartX, currentY);
    
    // Desenhar linha embaixo do nome (sublinhado)
    const nameWidth = pdf.getTextWidth(lead.name);
    const lineY = currentY + 2;
    pdf.setLineWidth(0.5);
    pdf.line(nameStartX, lineY, nameStartX + nameWidth, lineY);
    
    currentY += 12;

    pdf.setFont("helvetica", "bold");
    pdf.text("Nome completo:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.name, margin + 50, currentY);
    currentY += 10;

    pdf.setFont("helvetica", "bold");
    pdf.text("E-mail:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.email, margin + 50, currentY);
    currentY += 10;

    pdf.setFont("helvetica", "bold");
    pdf.text("Telefone:", margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(lead.phone, margin + 50, currentY);
    currentY += 20;

    // Detalhes da Aceitação (movido para o final, como estava antes)
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
    console.log("[PDF Generation] Generating PDF blob...");
    const pdfBlob = pdf.output("blob");
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);
    console.log("[PDF Generation] PDF blob generated, size:", pdfBuffer.length, "bytes");

    // Upload to Storage - usar nome da pessoa no nome do arquivo
    // Normalizar nome para criar nome de arquivo seguro
    // Remove acentos e caracteres especiais
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    // Adicionar timestamp para garantir unicidade
    const timestamp = Date.now();
    
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
    
    const fileName = `${normalizedName}_${dateStr}_${timestamp}.pdf`;
    console.log("[PDF Generation] Uploading PDF to storage, filename:", fileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true, // Permite sobrescrever se o arquivo já existir
      });

    if (uploadError) {
      console.error("[PDF Generation] Error uploading PDF:", uploadError);
      console.error("[PDF Generation] Upload error details:", JSON.stringify(uploadError));
      
      // Se o arquivo já existe (409), tentar deletar e fazer upload novamente
      if (uploadError.statusCode === "409" || uploadError.status === 409) {
        console.log(`File ${fileName} already exists, attempting to delete and re-upload...`);
        
        // Tentar deletar o arquivo existente
        const { error: deleteError } = await supabase.storage
          .from("contracts")
          .remove([fileName]);
        
        if (!deleteError) {
          // Tentar fazer upload novamente
          const { data: retryUploadData, error: retryUploadError } = await supabase.storage
            .from("contracts")
            .upload(fileName, pdfBuffer, {
              contentType: "application/pdf",
              upsert: true,
            });
          
          if (retryUploadError) {
            console.error("Error uploading PDF after retry:", retryUploadError);
            return new Response(
              JSON.stringify({ error: "Failed to upload PDF after retry" }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          // Se chegou aqui, o retry funcionou
          console.log("PDF uploaded successfully after retry");
        } else {
          // Se não conseguiu deletar, usar upsert diretamente (já está em upsert: true, então não deveria entrar aqui)
          console.error("Error deleting existing file:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to handle existing PDF file" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else {
        // Outro tipo de erro
        return new Response(
          JSON.stringify({ error: "Failed to upload PDF" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get public URL
    console.log("[PDF Generation] Getting public URL for PDF...");
    const {
      data: { publicUrl },
    } = supabase.storage.from("contracts").getPublicUrl(fileName);
    console.log("[PDF Generation] Public URL:", publicUrl);

    // Update term_acceptance with PDF URL
    console.log("[PDF Generation] Updating term_acceptance with PDF URL...");
    const { error: updateError } = await supabase
      .from("term_acceptance")
      .update({ pdf_url: publicUrl })
      .eq("id", term_acceptance_id);

    if (updateError) {
      console.error("[PDF Generation] Error updating term acceptance:", updateError);
      // Don't fail the request if update fails, PDF is already uploaded
    } else {
      console.log("[PDF Generation] Term acceptance updated successfully");
    }

    console.log("[PDF Generation] PDF generation completed successfully");
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
    console.error("[PDF Generation] CRITICAL ERROR:", error);
    console.error("[PDF Generation] Error stack:", error.stack);
    console.error("[PDF Generation] Error message:", error.message);
    console.error("[PDF Generation] Error name:", error.name);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

