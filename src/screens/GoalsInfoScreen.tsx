import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialIcons as Icon } from '@expo/vector-icons';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',
  cardBg: '#1E293B',
  gold: '#D4AF37',
  goldLight: '#FDE68A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.05)',
};

// ==============================================================================
// 🏆 OS NÍVEIS DE FATURAMENTO
// ==============================================================================
const TIERS = [
  { 
    id: 'bronze', 
    label: 'Nível Bronze', 
    limit: 10000, 
    color: '#CD7F32', 
    icon: 'emoji-events',
    desc: 'O início da jornada. Você está estruturando seu negócio, pagando as contas em dia e conquistando os primeiros clientes fiéis.' 
  },
  { 
    id: 'prata', 
    label: 'Nível Prata', 
    limit: 50000, 
    color: '#94A3B8', 
    icon: 'emoji-events',
    desc: 'A engrenagem está girando forte! Sua agenda vive cheia, a equipe está motivada e o faturamento já traz um lucro consistente.' 
  },
  { 
    id: 'ouro', 
    label: 'Nível Ouro', 
    limit: 100000, 
    color: '#D4AF37', 
    icon: 'emoji-events',
    desc: 'Nível de excelência e autoridade. Você domina a gestão e o seu negócio já é uma grande referência na sua região.' 
  },
  { 
    id: 'diamante', 
    label: 'Nível Diamante', 
    limit: 1000000, 
    color: '#38BDF8', 
    icon: 'diamond',
    desc: 'O topo do mercado. Uma verdadeira máquina de fazer dinheiro. Você não tem mais apenas um salão, você construiu um império.' 
  },
];

export function GoalsInfoScreen() {
  const navigation = useNavigation();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metas e Níveis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* INTRODUÇÃO */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Feather name="target" size={40} color={theme.gold} />
          </View>
          <Text style={styles.heroTitle}>
            Transforme seu negócio em um <Text style={{ color: theme.gold }}>Jogo de Sucesso</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            O Kairon te ajuda a visualizar seu crescimento. Bata suas metas de faturamento mensal e suba de nível para desbloquear o verdadeiro potencial da sua empresa.
          </Text>
        </View>

        {/* LISTA DE NÍVEIS */}
        <View style={styles.tiersContainer}>
          {TIERS.map((tier, index) => (
            <View key={tier.id} style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconBg, { backgroundColor: tier.color + '15' }]}>
                  <Icon name={tier.icon as any} size={28} color={tier.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                  <Text style={styles.tierLimit}>Meta: {formatCurrency(tier.limit)}</Text>
                </View>
              </View>
              <Text style={styles.tierDesc}>{tier.desc}</Text>
              
              {/* Linha de conexão entre os cards (exceto no último) */}
              {index !== TIERS.length - 1 && (
                <View style={styles.connectorLine} />
              )}
            </View>
          ))}
        </View>

        {/* DICA EXTRA */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Feather name="zap" size={20} color={theme.gold} />
            <Text style={styles.tipTitle}>Como subir de nível rápido?</Text>
          </View>
          <Text style={styles.tipText}>
            Não dependa apenas de cortes de cabelo. Venda produtos do estoque, crie pacotes recorrentes e use os lembretes de WhatsApp do plano Kairon PLUS para zerar os furos na agenda!
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.primary, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: theme.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  heroSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  iconCircle: { 
    width: 72, height: 72, borderRadius: 36, 
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, 
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: theme.textPrimary, textAlign: 'center', marginBottom: 12, lineHeight: 32 },
  heroSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },

  tiersContainer: { marginBottom: 20 },
  tierCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative'
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 16 },
  tierIconBg: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tierLabel: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  tierLimit: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
  tierDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 20 },
  
  connectorLine: {
    position: 'absolute',
    bottom: -16,
    left: 48,
    width: 2,
    height: 16,
    backgroundColor: theme.border,
    zIndex: -1
  },

  tipCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginTop: 10
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: theme.gold },
  tipText: { fontSize: 13, color: theme.textSecondary, lineHeight: 22 },
});