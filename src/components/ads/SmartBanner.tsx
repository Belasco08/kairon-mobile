import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/colors';

// ID de produção ou teste
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-SEU-ID-AQUI';

export function SmartBanner() {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Se for pagante, some tudo
  if (user?.plan === 'PLUS') return null;

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Anúncio - Dá um ar "Premium" ao problema */}
      <View style={styles.header}>
        <Text style={styles.label}>Patrocinado</Text>
        <TouchableOpacity 
            onPress={() => navigation.navigate('SubscriptionScreen' as never)}
            style={styles.removeBtn}
        >
            <Text style={styles.removeText}>Remover Anúncios</Text>
            <Feather name="arrow-right" size={12} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* O Anúncio em si */}
      <View style={styles.adWrapper}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        backgroundColor: '#F1F5F9', // Fundo cinza bem claro para separar do resto
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 8,
        alignItems: 'center'
    },
    label: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: '#94A3B8',
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    removeText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary
    },
    adWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        // Sombra leve para destacar o banner
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        backgroundColor: '#FFF',
        borderRadius: 4,
        overflow: 'hidden'
    }
});