import React from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext'; // 👈 Importamos o Contexto

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',      
  cardBg: '#1E293B',       
  gold: '#D4AF37',         
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
};

// As 3 telas do seu tutorial
const slides = [
  {
    key: '1',
    title: 'Agenda Inteligente',
    text: 'Diga adeus ao caderno. Controle seus agendamentos de forma rápida e não deixe nenhum cliente esperando.',
    icon: 'calendar',
  },
  {
    key: '2',
    title: 'Caixa e Comissões',
    text: 'Saiba exatamente quanto você ganhou no dia e deixe o sistema calcular a comissão da sua equipe sozinho.',
    icon: 'pie-chart',
  },
  {
    key: '3',
    title: 'Bata Metas e Cresça',
    text: 'Acompanhe seu fluxo de caixa, alcance as metas do mês e receba recompensas exclusivas do Kairon!',
    icon: 'award',
  }
];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { completeTutorial } = useAuth(); // 👈 Puxamos a função inteligente do Contexto

  // Função chamada quando o usuário clica em "Pular" ou "Começar"
  const handleDone = async () => {
    try {
      // 👇 Usamos a função do contexto! Ela salva a chave certa e atualiza o AppStack
      await completeTutorial(); 
      
      // Manda ele para a Home
      navigation.replace('BottomTabs'); 
    } catch (e) {
      console.error('Erro ao finalizar tutorial', e);
      navigation.replace('BottomTabs');
    }
  };

  // Como cada slide vai ser desenhado na tela
  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Feather name={item.icon as any} size={80} color={theme.gold} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <AppIntroSlider
        renderItem={renderItem}
        data={slides}
        onDone={handleDone}
        onSkip={handleDone}
        showSkipButton={true}
        bottomButton={false}
        // Textos dos botões
        nextLabel="Próximo"
        skipLabel="Pular"
        doneLabel="Começar"
        // Estilo dos botões e bolinhas
        activeDotStyle={{ backgroundColor: theme.gold, width: 24 }}
        dotStyle={{ backgroundColor: 'rgba(212, 175, 55, 0.3)' }}
        renderNextButton={() => (
            <View style={styles.btnWrapper}>
                <Text style={styles.btnText}>Próximo</Text>
            </View>
        )}
        renderSkipButton={() => (
            <View style={styles.btnWrapper}>
                <Text style={styles.skipText}>Pular</Text>
            </View>
        )}
        renderDoneButton={() => (
            <View style={[styles.btnWrapper, styles.doneBtn]}>
                <Text style={styles.doneText}>Começar</Text>
            </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.primary,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Dourado transparente
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 28,
    color: theme.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  btnWrapper: {
      padding: 12,
  },
  btnText: {
      color: theme.gold,
      fontWeight: 'bold',
      fontSize: 16,
  },
  skipText: {
      color: theme.textSecondary,
      fontSize: 16,
  },
  doneBtn: {
      backgroundColor: theme.gold,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginTop: 2,
  },
  doneText: {
      color: theme.primary,
      fontWeight: 'bold',
      fontSize: 16,
  }
});