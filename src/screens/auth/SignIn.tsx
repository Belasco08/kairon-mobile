import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/colors';
import { Input } from '../../components/ui/Input'; // Certifique-se que seu Input aceita 'leftIcon' ou adapte
import { Button } from '../../components/ui/Button';

export function SignIn() {
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = 'Digite seu e-mail';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!form.password) {
      newErrors.password = 'Digite sua senha';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      
      // Chama o contexto (que agora trata o erro 400 e joga uma mensagem limpa)
      await signIn(form.email, form.password);
      
      // Se der certo, o AuthContext atualiza o estado 'user' e o Router redireciona sozinho.
      
    } catch (error: any) {
      // 👇 AQUI: Exibe a mensagem amigável que veio do backend/contexto
      Alert.alert('Atenção', error.message || 'Ocorreu um erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER / LOGO AREA */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="scissors" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>Gerencie seu negócio com inteligência.</Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                {/* Se o seu componente Input suportar ícones, use. Se não, o layout ainda funciona. */}
                <Input
                    label="E-mail"
                    placeholder="exemplo@email.com"
                    value={form.email}
                    onChangeText={text => {
                        setForm({ ...form, email: text });
                        if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.email}
                    editable={!loading}
                />
            </View>

            <View style={styles.inputGroup}>
                <Input
                    label="Senha"
                    placeholder="••••••"
                    value={form.password}
                    onChangeText={text => {
                        setForm({ ...form, password: text });
                        if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    secureTextEntry
                    error={errors.password}
                    editable={!loading}
                />
            </View>
            
            <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button
                title="Entrar"
                onPress={handleSignIn}
                loading={loading}
                style={styles.loginButton}
                disabled={loading}
            />
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp' as never)}
              disabled={loading}
              style={styles.signupButton}
            >
              <Text style={styles.signupText}>Criar conta grátis</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center'
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#EFF6FF', // Azul bem clarinho ou use colors.primary + alpha
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1E293B', // Cor de texto escura
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B', // Cinza slate
        textAlign: 'center'
    },
    formContainer: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    loginButton: {
        height: 56, // Botão mais alto e moderno
        borderRadius: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto', // Empurra para o final se sobrar espaço
        paddingTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
    },
    signupButton: {
        marginLeft: 6,
        padding: 4,
    },
    signupText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: 'bold',
    }
});