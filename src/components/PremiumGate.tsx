import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho conforme sua estrutura

interface PremiumGateProps {
  children: React.ReactNode;
  description?: string;
}

export function PremiumGate({ children, description = "Funcionalidade exclusiva Premium" }: PremiumGateProps) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // Se o usuário for PLUS, libera o conteúdo normal
  if (user?.plan === 'PLUS') {
    return <>{children}</>;
  }

  // Se for FREE, borra o conteúdo e mostra o cadeado
  return (
    <View style={styles.container}>
      {/* Conteúdo "Bloqueado" (Fica meio transparente) */}
      <View style={styles.contentBlur}>
         {children}
      </View>
      
      {/* A "Porta" com o Cadeado */}
      <View style={styles.overlay}>
        <View style={styles.lockIconContainer}>
          <Feather name="lock" size={24} color="#D97706" />
        </View>
        
        <Text style={styles.title}>Funcionalidade PRO</Text>
        <Text style={styles.description}>{description}</Text>
        
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('SubscriptionScreen')} 
        >
          <Text style={styles.upgradeButtonText}>Liberar Acesso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'relative', 
    overflow: 'hidden', 
    borderRadius: 16 // Arredonda para não "vazar" o conteúdo
  },
  contentBlur: { 
    opacity: 0.08, // Deixa o gráfico bem fraquinho, só o vulto
    pointerEvents: 'none' // Impede cliques no gráfico
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Cobre tudo
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', // Fundo semi-transparente
    padding: 20,
    zIndex: 10
  },
  lockIconContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#D97706',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B',
    marginBottom: 4
  },
  description: { 
    fontSize: 13, 
    color: '#64748B', 
    textAlign: 'center', 
    marginBottom: 16,
    paddingHorizontal: 10
  },
  upgradeButton: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  upgradeButtonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  }
});