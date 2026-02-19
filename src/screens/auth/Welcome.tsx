import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function Welcome() {
  const navigation = useNavigation();

  // Cores do tema Premium (Azul Escuro e Dourado)
  const THEME = {
    primary: '#0F172A', // Azul Marinho do fundo
    gold: '#D4AF37',    // Dourado de destaque
    textLight: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.7)'
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <StatusBar backgroundColor={THEME.primary} barStyle="light-content" />
      
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          
          {/* Logo Oficial Arredondada */}
          <View style={{
            shadowColor: THEME.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
            marginBottom: 24,
            borderRadius: 70, // Necessário para a sombra acompanhar o círculo
          }}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{
                width: 140,
                height: 140,
                borderRadius: 70, // Metade do tamanho (140/2 = 70) para ficar redondo
                borderWidth: 2, // Bordinha fina
                borderColor: THEME.gold, // Cor da borda
                resizeMode: 'cover', // Preenche todo o círculo
                overflow: 'hidden', // Corta o que sobrar fora do círculo
              }}
            />
          </View>
          
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: THEME.gold, textAlign: 'center' }}>
            KAIRON
          </Text>
          <Text style={{ fontSize: 16, color: THEME.textLight, opacity: 0.9, textAlign: 'center', marginTop: 8 }}>
            Agendamento Inteligente
          </Text>
          <Text style={{ fontSize: 14, color: THEME.textMuted, textAlign: 'center', marginTop: 16 }}>
            Gerencie sua agenda de forma simples e automatizada
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          {/* Botão Primário (Fundo Dourado, Texto Escuro) */}
          <TouchableOpacity
            style={{
              backgroundColor: THEME.gold,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              shadowColor: THEME.gold,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={() => navigation.navigate('SignIn' as never)}
          >
            <Text style={{ color: THEME.primary, fontSize: 16, fontWeight: 'bold' }}>
              Entrar
            </Text>
          </TouchableOpacity>

          {/* Botão Secundário (Fundo Transparente, Borda e Texto Dourados) */}
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: THEME.gold,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('SignUp' as never)}
          >
            <Text style={{ color: THEME.gold, fontSize: 16, fontWeight: 'bold' }}>
              Criar Conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: THEME.textMuted }}>
            Para profissionais de serviços
          </Text>
          <Text style={{ fontSize: 12, color: THEME.textMuted, marginTop: 4 }}>
            Barbearias • Estética • Lash Design • e muito mais
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}