import React, { useState } from "react";
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
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons"; // Trocado para manter o padrão do SignUp

import { useAuth } from "../../contexts/AuthContext";
import { Input } from "../../components/ui/Input";

// Definindo o tema Kairon Premium
const THEME = {
  primary: "#0F172A", // Azul Marinho do fundo
  surface: "#1E293B",
  gold: "#D4AF37", // Dourado
  goldLight: "rgba(212, 175, 55, 0.1)",
  textLight: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.7)",
  border: "rgba(212, 175, 55, 0.3)",
};

export function SignIn() {
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = "Digite seu e-mail";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!form.password) {
      newErrors.password = "Digite sua senha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await signIn(form.email, form.password);
    } catch (error: any) {
      Alert.alert(
        "Atenção",
        error.message || "Ocorreu um erro ao tentar entrar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão de Voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={28} color={THEME.gold} />
          </TouchableOpacity>

          {/* HEADER / LOGO AREA */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="login" size={40} color={THEME.gold} />
            </View>
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>
              Gerencie seu negócio com inteligência.
            </Text>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Input
                label="E-mail"
                placeholder="exemplo@email.com"
                value={form.email}
                onChangeText={(text) => {
                  setForm({ ...form, email: text });
                  if (errors.email) setErrors({ ...errors, email: "" });
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
                onChangeText={(text) => {
                  setForm({ ...form, password: text });
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                secureTextEntry
                error={errors.password}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword" as never)}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* Botão Dourado Padronizado */}
            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={THEME.primary} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp" as never)}
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
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
    marginTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.goldLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: THEME.gold,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textMuted,
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: THEME.gold,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: THEME.gold,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  footerText: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  signupButton: {
    marginLeft: 6,
    padding: 4,
  },
  signupText: {
    fontSize: 15,
    color: THEME.gold,
    fontWeight: "bold",
  },
});
