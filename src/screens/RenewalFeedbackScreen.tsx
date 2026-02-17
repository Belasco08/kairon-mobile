import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  background: '#0F172A',    
  cardBg: '#1E293B',        
  textPrimary: '#FFFFFF',   
  textSecondary: '#94A3B8', 
  
  gold: '#D4AF37',          
  goldLight: '#FDE68A',     
  goldDark: '#B8860B',

  success: '#10B981',       
  border: 'rgba(255, 255, 255, 0.05)',
};

export function RenewalFeedbackScreen() {
  const navigation = useNavigation<any>();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👇 SUA URL DO DISCORD AQUI
  const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1472770528128532654/pRDkHkyNdpTLv7VRbXhiABED-_h1AbY9dZT64ndWbXcedXA2JLHR_yzVyl7V5pP5b6SW";

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Atenção", "Por favor, deixe sua nota em estrelas para continuarmos melhorando!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Montando a mensagem (Embed) para o Discord ficar com cara de notificação premium
      const message = {
        content: null,
        embeds: [
          {
            title: "🚀 Novo Feedback do Kairon PLUS!",
            color: 13938487, // Cor dourada em decimal (Hex: #D4AF37)
            fields: [
              {
                name: "⭐ Nota",
                value: `${rating} de 5 estrelas`,
                inline: true
              },
              {
                name: "💬 O que o Kairon deve fazer agora?",
                value: feedback.trim() ? feedback : "*Nenhum texto escrito pelo cliente.*"
              }
            ],
            footer: {
              text: "Kairon Feedback System"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Disparando para o Webhook do Discord
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      // Sucesso na tela do usuário
      Alert.alert(
        "Muito Obrigado! 🏆",
        "Seu feedback foi direto para a mesa dos nossos desenvolvedores. Sua assinatura Kairon PLUS segue ativa para mais um mês de lucros!",
        [{ text: "Voltar pro App", onPress: () => navigation.navigate('BottomTabs') }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Ops", "Não conseguimos enviar seu feedback agora, mas agradecemos a intenção!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* HEADER DE CELEBRAÇÃO */}
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Feather name="award" size={42} color={theme.gold} />
            </View>
            
            <Text style={styles.title}>
              1 Mês de <Text style={{ color: theme.gold }}>Elite!</Text> 🥂
            </Text>
            
            <Text style={styles.subtitle}>
              Parabéns por completar seu primeiro mês no Kairon PLUS. O seu negócio já está em outro patamar, mas nós queremos ir além.
            </Text>
          </View>

          {/* SESSÃO DE AVALIAÇÃO (ESTRELAS) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Como tem sido sua experiência?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Feather 
                    name="star" 
                    size={36} 
                    // Se a estrela clicada for menor ou igual ao rating atual, pinta de dourado
                    color={star <= rating ? theme.gold : theme.textSecondary} 
                    style={star <= rating ? styles.starGlow : null}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating === 0 ? "Toque nas estrelas para avaliar" : 
               rating <= 3 ? "Obrigado! Como podemos melhorar?" : 
               rating === 4 ? "Quase perfeito! O que faltou?" : 
               "Incrível! Ficamos muito felizes."}
            </Text>
          </View>

          {/* SESSÃO DE FEEDBACK / ROADMAP */}
          <View style={styles.card}>
            <View style={styles.feedbackHeader}>
              <Feather name="zap" size={20} color={theme.gold} />
              <Text style={styles.cardTitle}>O que o Kairon deve fazer por você agora?</Text>
            </View>
            
            <Text style={styles.cardDescription}>
              Nós construímos este app para você. Qual nova função, relatório ou tela faria você ganhar ainda mais dinheiro e tempo?
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Ex: Queria um gráfico que me mostrasse qual o dia mais fraco da semana..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* RODAPÉ E BOTÃO DE CONTINUAR */}
        <View style={styles.footer}>
          <Text style={styles.renewalText}>
            Sua assinatura Kairon PLUS será renovada automaticamente.
          </Text>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.shadowButton}
          >
            <LinearGradient
              colors={[theme.gold, theme.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "ENVIANDO..." : "ENVIAR E CONTINUAR NO PLUS"}
              </Text>
              {!isSubmitting && <Feather name="arrow-right" size={20} color={theme.background} style={{marginLeft: 8}} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 24, paddingBottom: 160 },
  
  heroSection: { alignItems: 'center', marginBottom: 32, marginTop: Platform.OS === 'android' ? 20 : 0 },
  iconCircle: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, 
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: theme.gold, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginBottom: 16, textAlign: 'center' },
  cardDescription: { fontSize: 13, color: theme.textSecondary, marginBottom: 20, lineHeight: 20 },
  
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  starButton: { padding: 4 },
  starGlow: { textShadowColor: 'rgba(212, 175, 55, 0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  ratingText: { fontSize: 13, color: theme.gold, textAlign: 'center', fontWeight: '600' },

  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, justifyContent: 'center' },
  
  textArea: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: theme.textPrimary,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: theme.background, 
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, 
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', 
  },
  renewalText: { textAlign: 'center', color: theme.textSecondary, fontSize: 12, marginBottom: 16 },
  
  shadowButton: { shadowColor: theme.gold, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6 },
  submitButtonGradient: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  submitText: { color: theme.background, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});