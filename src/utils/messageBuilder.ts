import { format, parseISO } from 'date-fns';

// 1. Template Padrão (Fica fora da função para não recriar a cada chamada)
const DEFAULT_TEMPLATE = 
`Olá *{CLIENTE}*! 👋
Seu agendamento foi confirmado!

🗓 Data: {DATA}
⏰ Horário: {HORA}
✂️ Profissional: {PROFISSIONAL}
💰 Valor: {VALOR}

📍 Endereço: {ENDERECO}

Te aguardamos na *{EMPRESA}*! 👊`;

// 2. Interfaces para tipar os dados que a função precisa
interface AppointmentData {
  startTime: string;
  totalPrice: number;
  clientName: string;
  professionalName?: string;
}

interface CompanyData {
  name?: string;
  address?: string;
  whatsappTemplate?: string; // O template personalizado vem aqui
}

/**
 * Constrói a mensagem de WhatsApp substituindo as variáveis
 */
export function buildWhatsAppMessage(
  appointment: AppointmentData,
  company: CompanyData | undefined | null,
  fallbackProfessionalName?: string
): string {

  // A. Escolhe o template: Personalizado da empresa OU o Padrão
  let message = company?.whatsappTemplate || DEFAULT_TEMPLATE;

  // B. Prepara os dados formatados
  const dateObj = parseISO(appointment.startTime);
  
  const formattedDate = format(dateObj, 'dd/MM/yyyy');
  const formattedTime = format(dateObj, 'HH:mm');
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(appointment.totalPrice);

  const professionalName = appointment.professionalName || fallbackProfessionalName || 'Profissional';

  // C. Dicionário de Substituições (Mapa Chave -> Valor)
  // Isso elimina aquele monte de .replace() solto
  const replacements: Record<string, string> = {
    '{CLIENTE}': appointment.clientName || 'Cliente',
    '{PROFISSIONAL}': professionalName,
    '{DATA}': formattedDate,
    '{HORA}': formattedTime,
    '{VALOR}': formattedPrice,
    '{ENDERECO}': company?.address || 'Endereço não informado',
    '{EMPRESA}': company?.name || 'Barbearia',
  };

  // D. Aplica as substituições
  Object.keys(replacements).forEach((key) => {
    // Usa Regex Global (/g) para substituir todas as ocorrências da tag, não só a primeira
    message = message.replace(new RegExp(key, 'g'), replacements[key]);
  });

  return message;
}