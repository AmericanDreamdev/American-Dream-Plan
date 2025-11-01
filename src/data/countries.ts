// Lista completa de países com códigos de discagem internacional
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string; // Nome em português
  dialCode: string; // Código de discagem (+55, +1, etc)
}

export const countries: Country[] = [
  // Países mais utilizados (aparecem primeiro)
  { code: "BR", name: "Brasil", dialCode: "+55" },
  { code: "US", name: "Estados Unidos", dialCode: "+1" },
  
  // América do Norte
  { code: "CA", name: "Canadá", dialCode: "+1" },
  { code: "MX", name: "México", dialCode: "+52" },
  
  // América Central
  { code: "GT", name: "Guatemala", dialCode: "+502" },
  { code: "BZ", name: "Belize", dialCode: "+501" },
  { code: "SV", name: "El Salvador", dialCode: "+503" },
  { code: "HN", name: "Honduras", dialCode: "+504" },
  { code: "NI", name: "Nicarágua", dialCode: "+505" },
  { code: "CR", name: "Costa Rica", dialCode: "+506" },
  { code: "PA", name: "Panamá", dialCode: "+507" },
  
  // Caribe
  { code: "CU", name: "Cuba", dialCode: "+53" },
  { code: "JM", name: "Jamaica", dialCode: "+1" },
  { code: "HT", name: "Haiti", dialCode: "+509" },
  { code: "DO", name: "República Dominicana", dialCode: "+1" },
  { code: "PR", name: "Porto Rico", dialCode: "+1" },
  { code: "TT", name: "Trinidad e Tobago", dialCode: "+1" },
  
  // América do Sul
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "CL", name: "Chile", dialCode: "+56" },
  { code: "CO", name: "Colômbia", dialCode: "+57" },
  { code: "PE", name: "Peru", dialCode: "+51" },
  { code: "VE", name: "Venezuela", dialCode: "+58" },
  { code: "EC", name: "Equador", dialCode: "+593" },
  { code: "BO", name: "Bolívia", dialCode: "+591" },
  { code: "PY", name: "Paraguai", dialCode: "+595" },
  { code: "UY", name: "Uruguai", dialCode: "+598" },
  { code: "GY", name: "Guiana", dialCode: "+592" },
  { code: "SR", name: "Suriname", dialCode: "+597" },
  { code: "GF", name: "Guiana Francesa", dialCode: "+594" },
  { code: "FK", name: "Ilhas Falkland", dialCode: "+500" },
  
  // Europa
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "ES", name: "Espanha", dialCode: "+34" },
  { code: "FR", name: "França", dialCode: "+33" },
  { code: "DE", name: "Alemanha", dialCode: "+49" },
  { code: "IT", name: "Itália", dialCode: "+39" },
  { code: "GB", name: "Reino Unido", dialCode: "+44" },
  { code: "IE", name: "Irlanda", dialCode: "+353" },
  { code: "BE", name: "Bélgica", dialCode: "+32" },
  { code: "NL", name: "Países Baixos", dialCode: "+31" },
  { code: "CH", name: "Suíça", dialCode: "+41" },
  { code: "AT", name: "Áustria", dialCode: "+43" },
  { code: "SE", name: "Suécia", dialCode: "+46" },
  { code: "NO", name: "Noruega", dialCode: "+47" },
  { code: "DK", name: "Dinamarca", dialCode: "+45" },
  { code: "FI", name: "Finlândia", dialCode: "+358" },
  { code: "PL", name: "Polônia", dialCode: "+48" },
  { code: "CZ", name: "República Tcheca", dialCode: "+420" },
  { code: "GR", name: "Grécia", dialCode: "+30" },
  { code: "RU", name: "Rússia", dialCode: "+7" },
  { code: "TR", name: "Turquia", dialCode: "+90" },
  
  // África
  { code: "ZA", name: "África do Sul", dialCode: "+27" },
  { code: "EG", name: "Egito", dialCode: "+20" },
  { code: "NG", name: "Nigéria", dialCode: "+234" },
  { code: "KE", name: "Quênia", dialCode: "+254" },
  { code: "GH", name: "Gana", dialCode: "+233" },
  { code: "AO", name: "Angola", dialCode: "+244" },
  { code: "MZ", name: "Moçambique", dialCode: "+258" },
  { code: "CV", name: "Cabo Verde", dialCode: "+238" },
  { code: "GW", name: "Guiné-Bissau", dialCode: "+245" },
  { code: "ST", name: "São Tomé e Príncipe", dialCode: "+239" },
  
  // Ásia
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "JP", name: "Japão", dialCode: "+81" },
  { code: "KR", name: "Coreia do Sul", dialCode: "+82" },
  { code: "IN", name: "Índia", dialCode: "+91" },
  { code: "ID", name: "Indonésia", dialCode: "+62" },
  { code: "PH", name: "Filipinas", dialCode: "+63" },
  { code: "TH", name: "Tailândia", dialCode: "+66" },
  { code: "VN", name: "Vietnã", dialCode: "+84" },
  { code: "MY", name: "Malásia", dialCode: "+60" },
  { code: "SG", name: "Singapura", dialCode: "+65" },
  { code: "AE", name: "Emirados Árabes Unidos", dialCode: "+971" },
  { code: "SA", name: "Arábia Saudita", dialCode: "+966" },
  { code: "IL", name: "Israel", dialCode: "+972" },
  { code: "PK", name: "Paquistão", dialCode: "+92" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  
  // Oceania
  { code: "AU", name: "Austrália", dialCode: "+61" },
  { code: "NZ", name: "Nova Zelândia", dialCode: "+64" },
  { code: "FJ", name: "Fiji", dialCode: "+679" },
  { code: "PG", name: "Papua Nova Guiné", dialCode: "+675" },
  
  // Outros importantes
  { code: "TL", name: "Timor-Leste", dialCode: "+670" },
  { code: "MO", name: "Macau", dialCode: "+853" },
  { code: "HK", name: "Hong Kong", dialCode: "+852" },
];

// Ordenar países: Brasil e EUA primeiro, depois o resto alfabeticamente
const priorityCountries = ["BR", "US"];
countries.sort((a, b) => {
  const aIsPriority = priorityCountries.includes(a.code);
  const bIsPriority = priorityCountries.includes(b.code);
  
  // Se ambos são prioritários, Brasil vem antes de EUA
  if (aIsPriority && bIsPriority) {
    if (a.code === "BR") return -1;
    if (b.code === "BR") return 1;
    return 0;
  }
  
  // Países prioritários sempre primeiro
  if (aIsPriority) return -1;
  if (bIsPriority) return 1;
  
  // Resto ordenado alfabeticamente
  return a.name.localeCompare(b.name, "pt");
});

