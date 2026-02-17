import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { checkBackend } from './src/services/auth';

import { WebSocketProvider } from './src/contexts/WebSocketContext';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { CompanyProvider } from './src/contexts/CompanyContext';

// Navigation
import { Navigation } from './src/navigation';

// Styles
import { colors } from './src/styles/colors';
import { commonStyles } from './src/styles/common';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  async function test() {
    try {
      await test();
      const res = await checkBackend();
      alert('Backend respondeu: ' + res);
    } catch (err) {
      alert('Erro ao conectar no backend');
      console.log(err);
    }
  }

  useEffect(() => {
    async function prepare() {
      try {
        // Pré-carregar recursos, fontes, ou dados aqui
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  if (isLoading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProvider>
          
        
        <CompanyProvider>
          <Navigation />
          <StatusBar
            barStyle="dark-content" // muda cor do texto do status bar
            backgroundColor={colors.background} // muda cor de fundo do status bar
          />
        </CompanyProvider>
        </WebSocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
