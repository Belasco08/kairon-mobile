import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ⚠️ Se o erro continuar, apague o '../' e digite novamente para o VSCode achar o caminho certo
import { appointmentService } from '../services/appointments';
import { useAuth } from '../contexts/AuthContext';

import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const theme = {
  primary: '#0F172A', 
  cardBg: '#1E293B', 
  gold: '#D4AF37', 
  goldLight: '#FDE68A', 
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8', 
  success: '#10B981', 
  border: 'rgba(255, 255, 255, 0.05)',
};

// ⚠️ COLOQUE O LINK DO GOOGLE MAPS DA BARBEARIA AQUI
const GOOGLE_MAPS_LINK = "https://g.page/r/SuaBarbearia/review"; 

export function ReviewBooster() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    loadCompletedAppointments();
  }, []);

  const loadCompletedAppointments = async () => {
    try {
      setLoading(true);

      // 👇 Bate direto na rota nova sem precisar passar o ID da empresa
      const data = await appointmentService.getCompletedForReview();
      
      // Filtra para garantir que tem telefone
      const validClients = data.filter((app: any) => app.clientPhone || app.client?.phone);
      setAppointments(validClients);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReviewRequest = async (clientName: string, clientPhone: string, professionalName: string) => {
    if (!clientPhone) return;

    const firstName = clientName.split(' ')[0];
    const message = `Fala ${firstName}, tudo beleza? ✂️\n\nAqui é da barbearia! O talento que o ${professionalName} deu no seu cabelo hoje ficou top demais!\n\nIrmão, dá uma força pra gente crescer? Leva só 10 segundinhos pra deixar 5 estrelas no nosso Google Maps. Isso ajuda muito o nosso trampo! ⭐⭐⭐⭐⭐\n\nClica aqui: ${GOOGLE_MAPS_LINK}\n\nTamo junto!`;

    const cleanPhone = clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", "WhatsApp não está instalado no seu celular.");
    }
  };

  const renderClient = ({ item }: { item: any }) => {
    const clientName = item.clientName || item.client?.name || "Cliente";
    const clientPhone = item.clientPhone || item.client?.phone;
    const professionalName = item.professionalName || item.professional?.name || "Barbeiro";
    
    let dateStr = "Hoje";
    try {
        const date = parseISO(item.startTime);
        if (isValid(date)) dateStr = format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {}

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{clientName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.detailsText}>Corte com {professionalName} • {dateStr}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.whatsappBtn}
          onPress={() => handleSendReviewRequest(clientName, clientPhone, professionalName)}
        >
          <Feather name="message-circle" size={18} color="#FFF" />
          <Text style={styles.whatsappBtnText}>Pedir 5 Estrelas</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 16 }}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Impulsionar Google ⭐</Text>
            <Text style={styles.headerSubtitle}>Peça avaliações dos cortes recentes</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.gold} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.center}>
                <Feather name="star" size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Nenhum corte concluído recentemente para pedir avaliação.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.goldLight, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  cardInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212, 175, 55, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  avatarText: { fontSize: 18, fontWeight: '800', color: theme.gold },
  clientName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  detailsText: { fontSize: 12, color: theme.textSecondary },
  whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  whatsappBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});