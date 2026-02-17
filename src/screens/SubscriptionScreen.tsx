import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM (Página de Vendas de Alta Conversão)
// ==============================================================================
const theme = {
  background: '#0F172A',    
  cardBg: '#1E293B',        
  textPrimary: '#FFFFFF',   
  textSecondary: '#94A3B8', 
  
  gold: '#D4AF37',          
  goldLight: '#FDE68A',     
  goldText: '#E2C792',      

  success: '#10B981',       
  danger: '#EF4444',
};

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    
    // SIMULAÇÃO DE COMPRA
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Bem-vindo à Elite! 🥂",
        "Sua assinatura Kairon PLUS foi ativada com sucesso.",
        [
          { text: "Acessar Painel VIP", onPress: () => navigation.goBack() }
        ]
      );
    }, 2000);
  };

  const benefits = [
    { 
      icon: 'message-circle', 
      title: 'Adeus aos Furos na Agenda', 
      desc: 'Lembretes automáticos no WhatsApp do cliente. Reduza em até 80% as faltas.' 
    },
    { 
      icon: 'package', 
      title: 'Controle de Estoque Anti-Furo', 
      desc: 'Saiba exatamente o que tem na prateleira e evite perder vendas por falta de produto.' 
    },
    { 
      icon: 'pie-chart', 
      title: 'Raio-X Financeiro (PDF)', 
      desc: 'Gráficos avançados e exportação de relatórios com a sua logo para o contador.' 
    },
    { 
      icon: 'users', 
      title: 'Equipe e Comissões no Piloto Automático', 
      desc: 'O sistema calcula as comissões de todos os profissionais em segundos.' 
    },
    { 
      icon: 'target', 
      title: 'Metas e Gamificação', 
      desc: 'Ative a barra de metas e faça sua equipe vender mais todos os dias.' 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      {/* HEADER DE NAVEGAÇÃO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton} activeOpacity={0.7}>
          <Feather name="x" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION (HEADLINE DE VENDAS) */}
        <View style={styles.heroSection}>
          <View style={styles.badgeTop}>
            <Feather name="star" size={14} color={theme.background} style={{ marginRight: 6 }} />
            <Text style={styles.badgeTopText}>O SEGREDO DOS GRANDES NEGÓCIOS</Text>
          </View>
          
          <Text style={styles.title}>
            Destrave o Verdadeiro Potencial da sua Empresa com o <Text style={{color: theme.gold}}>Kairon PLUS</Text>
          </Text>
          
          <Text style={styles.subtitle}>
            Automatize o trabalho chato, acabe com os furos na agenda e foque apenas em fazer dinheiro.
          </Text>
        </View>

        {/* LISTA DE BENEFÍCIOS IRRESISTÍVEIS */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsHeadline}>O que você ganha agora:</Text>
          
          {benefits.map((item, index) => (
            <View key={index} style={[
                styles.benefitItem, 
                index === benefits.length - 1 && { marginBottom: 0, borderBottomWidth: 0 } 
            ]}>
              <View style={styles.benefitIconBox}>
                <Feather name={item.icon as any} size={22} color={theme.gold} />
              </View>
              <View style={styles.benefitTextBox}>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* GARANTIA DE RISCO ZERO */}
        <View style={styles.guaranteeBox}>
          <MaterialCommunityIcons name="shield-check" size={40} color={theme.gold} style={{ marginBottom: 12 }} />
          <Text style={styles.guaranteeTitle}>Risco Absolutamente Zero</Text>
          <Text style={styles.guaranteeDesc}>
            Teste todos os recursos VIP por <Text style={{fontWeight: 'bold', color: theme.textPrimary}}>7 dias grátis</Text>. 
            Se o app não pagar a própria assinatura economizando seu tempo, você cancela com um clique.
          </Text>
        </View>

      </ScrollView>

      {/* RODAPÉ FIXO DE CHECKOUT */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
            <View>
                <Text style={styles.priceLabel}>Acesso Completo</Text>
                <Text style={styles.priceSubLabel}>Menos de R$ 1,70 por dia.</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                <Text style={styles.currency}>R$</Text>
                <Text style={styles.priceValue}>49,90</Text>
                <Text style={styles.period}>/mês</Text>
            </View>
        </View>

        {/* BOTÃO DE ASSINATURA (DEGRADÊ DE ALTA CONVERSÃO) */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleSubscribe}
          disabled={loading}
          style={styles.shadowButton}
        >
          <LinearGradient
            colors={[theme.gold, '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscribeButtonGradient}
          >
            {loading ? (
                <Text style={styles.subscribeText}>PROCESSANDO...</Text>
            ) : (
                <>
                  <Text style={styles.subscribeText}>COMEÇAR 7 DIAS GRÁTIS</Text>
                  <Feather name="arrow-right" size={20} color={theme.background} style={{marginLeft: 8}} />
                </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.termsText}>
          <Feather name="lock" size={12} /> Pagamento 100% seguro via Google Play / App Store.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 16 : 10, zIndex: 10 },
  closeButton: { alignSelf: 'flex-end', padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  
  scrollContent: { paddingHorizontal: 24, paddingBottom: 180, paddingTop: 10 },
  
  heroSection: { alignItems: 'center', marginBottom: 32 },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeTopText: { fontSize: 11, fontWeight: '800', color: theme.background, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, textAlign: 'center', lineHeight: 36, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 24, paddingHorizontal: 10 },

  benefitsHeadline: { fontSize: 18, fontWeight: '800', color: theme.textPrimary, marginBottom: 20, textAlign: 'center' },
  benefitsContainer: { backgroundColor: theme.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  benefitItem: { flexDirection: 'row', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  benefitIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(212, 175, 55, 0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  benefitTextBox: { flex: 1, justifyContent: 'center' },
  benefitTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 },
  benefitDesc: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

  guaranteeBox: { marginTop: 32, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  guaranteeTitle: { fontSize: 18, fontWeight: '800', color: theme.success, marginBottom: 8 },
  guaranteeDesc: { textAlign: 'center', color: theme.textSecondary, fontSize: 14, lineHeight: 22 },

  footer: { 
      position: 'absolute', bottom: 0, left: 0, right: 0, 
      backgroundColor: theme.cardBg, 
      borderTopLeftRadius: 32, borderTopRightRadius: 32, 
      padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, 
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', 
      shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 
  },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceLabel: { fontSize: 16, color: theme.textPrimary, fontWeight: '800' },
  priceSubLabel: { fontSize: 13, color: theme.success, marginTop: 4, fontWeight: '600' },
  currency: { fontSize: 16, fontWeight: 'bold', color: theme.gold, marginRight: 4 },
  priceValue: { fontSize: 38, fontWeight: '900', color: theme.gold, letterSpacing: -1 },
  period: { fontSize: 14, color: theme.textSecondary, marginLeft: 4, fontWeight: '600' },
  
  shadowButton: { shadowColor: theme.gold, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 8 },
  subscribeButtonGradient: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  subscribeText: { color: theme.background, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  termsText: { textAlign: 'center', fontSize: 12, color: theme.textSecondary, marginTop: 16, opacity: 0.8 },
});