import { Linking, Alert, Platform } from 'react-native';

interface AppointmentData {
  clientName: string;
  clientPhone: string;
  date: string;     // ex: 10/02
  time: string;     // ex: 14:00
  professionalName: string;
  totalPrice: string; // ex: R$ 50,00
}

export const sendWhatsAppConfirmation = (data: AppointmentData) => {
  // 1. Limpa o telefone (deixa só números)
  const phone = data.clientPhone.replace(/\D/g, '');
  
  // 2. Garante o DDI (55 para Brasil)
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

  // 3. Monta a mensagem (Use \n para pular linha)
  // O * deixa em negrito no WhatsApp
  const message = 
`✅ *Agendamento Confirmado!*

Olá, *${data.clientName}*! Tudo certo com seu horário.

🗓 *Data:* ${data.date}
⏰ *Horário:* ${data.time}
💇‍♂️ *Profissional:* ${data.professionalName}
💰 *Valor:* ${data.totalPrice}

📍 *Local:* Barbearia Kairon
Qualquer dúvida, é só chamar! 👊`;

  // 4. Cria o Link Universal do WhatsApp
  const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;

  // 5. Abre o App
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert("Erro", "WhatsApp não está instalado neste dispositivo.");
      }
    })
    .catch((err) => console.error("Erro ao abrir WhatsApp", err));
};