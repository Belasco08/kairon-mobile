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
import { colors } from '../../styles/colors';

export function Welcome() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.primary }}>
              K
            </Text>
          </View>
          
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.textLight, textAlign: 'center' }}>
            KAIRON
          </Text>
          <Text style={{ fontSize: 16, color: colors.textLight, opacity: 0.9, textAlign: 'center', marginTop: 8 }}>
            Agendamento Inteligente
          </Text>
          <Text style={{ fontSize: 14, color: colors.textLight, opacity: 0.8, textAlign: 'center', marginTop: 16 }}>
            Gerencie sua agenda de forma simples e automatizada
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('SignIn' as never)}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
              Entrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: colors.textLight,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('SignUp' as never)}
          >
            <Text style={{ color: colors.textLight, fontSize: 16, fontWeight: '600' }}>
              Criar Conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.textLight, opacity: 0.7 }}>
            Para profissionais de serviços
          </Text>
          <Text style={{ fontSize: 12, color: colors.textLight, opacity: 0.7, marginTop: 4 }}>
            Barbearias • Estética • Lash Design • e muito mais
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}