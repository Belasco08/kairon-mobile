import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',      
  cardBg: '#1E293B',       
  gold: '#D4AF37',         
  goldLight: '#FDE68A',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#10B981',
  danger: '#EF4444',
  border: 'rgba(255, 255, 255, 0.05)',
};

// ==============================================================================
// ⚠️ ATENÇÃO: SUBSTITUA PELO SEU IP
// ==============================================================================
const API_URL = "https://kairon-api.onrender.com"; 

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfileSettings() {
  const navigation = useNavigation();
  const { user, updateUser, signOut } = useAuth();

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Estado para forçar a atualização da imagem (Cache Busting)
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // ============================================================
  // LÓGICA DE CARREGAMENTO DA IMAGEM
  // ============================================================
  const getAvatarSource = () => {
    // 👇 FIX: Retornar undefined em vez de null para evitar o erro no <Image>
    if (!user?.avatar) return undefined;

    const avatarPath = user.avatar;

    if (avatarPath.startsWith('http')) {
      return { uri: avatarPath };
    }

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
    const fullUrl = `${baseUrl}${path}?t=${avatarVersion}`;
    
    return { uri: fullUrl };
  };

  const handlePhoneChange = (text: string) => {
    let value = text.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    updateForm("phone", value);
  };

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!form.email.trim()) newErrors.email = "E-mail é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "E-mail inválido";

    if (changePassword) {
      if (!form.currentPassword) newErrors.currentPassword = "Senha atual é obrigatória";
      if (form.newPassword && form.newPassword.length < 6) {
        newErrors.newPassword = "A nova senha deve ter no mínimo 6 caracteres";
      }
      if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = "As senhas não coincidem";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
      };

      if (changePassword && form.newPassword) {
        updateData.currentPassword = form.currentPassword;
        updateData.newPassword = form.newPassword;
      }

      const updatedUser = await authService.updateProfile(updateData);
      await updateUser(updatedUser);

      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setChangePassword(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Erro", error.response?.data?.message || "Não foi possível atualizar o perfil");
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const formData = new FormData();
        
        const imageFile = {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "avatar.jpg",
        } as any;

        formData.append("avatar", imageFile);

        const updatedUserResponse = await authService.uploadAvatar(formData);
        
        await updateUser(updatedUserResponse);
        setAvatarVersion(Date.now());
        
        Alert.alert("Sucesso", "Foto atualizada!");
      }
    } catch (error) {
      console.error("Error picking avatar:", error);
      Alert.alert("Erro", "Falha ao enviar a imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sair", "Tem certeza que deseja desconectar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const avatarSource = getAvatarSource();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarContainer} activeOpacity={0.8}>
              
              {/* LÓGICA DE EXIBIÇÃO DA FOTO */}
              {avatarSource ? (
                <Image 
                  source={avatarSource} 
                  style={styles.avatarImage} 
                  key={avatarVersion}
                />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              
              <View style={styles.cameraButton}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Feather name="camera" size={14} color={theme.primary} />
                )}
              </View>
            </TouchableOpacity>
            
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
                <Text style={styles.userRole}>
                {user?.role === "OWNER" ? "Administrador" : "Profissional"}
                </Text>
            </View>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formSection}>
            
            {/* Dados Pessoais */}
            <View style={styles.sectionHeader}>
              <Feather name="user" size={18} color={theme.gold} />
              <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Nome Completo"
                value={form.name}
                onChangeText={(v) => updateForm("name", v)}
                placeholder="Seu nome"
                error={errors.name}
              />
              <Input
                label="E-mail"
                value={form.email}
                onChangeText={(v) => updateForm("email", v)}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <Input
                label="Telefone (WhatsApp)"
                value={form.phone}
                onChangeText={handlePhoneChange}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Segurança */}
            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
              <Feather name="lock" size={18} color={theme.gold} />
              <Text style={styles.sectionTitle}>Segurança</Text>
            </View>

            {!changePassword ? (
              <TouchableOpacity 
                style={styles.changePasswordButton} 
                onPress={() => setChangePassword(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.changePasswordText}>Alterar minha senha</Text>
                <Feather name="chevron-right" size={20} color={theme.gold} />
              </TouchableOpacity>
            ) : (
              <View style={styles.passwordContainer}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.passwordTitle}>Redefinir Senha</Text>
                  <TouchableOpacity onPress={() => setChangePassword(false)}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
                
                <Input
                  label="Senha Atual"
                  value={form.currentPassword}
                  onChangeText={(v) => updateForm("currentPassword", v)}
                  placeholder="******"
                  secureTextEntry
                  error={errors.currentPassword}
                />
                <Input
                  label="Nova Senha"
                  value={form.newPassword}
                  onChangeText={(v) => updateForm("newPassword", v)}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  error={errors.newPassword}
                />
                <Input
                  label="Confirmar Senha"
                  value={form.confirmPassword}
                  onChangeText={(v) => updateForm("confirmPassword", v)}
                  placeholder="Repita a nova senha"
                  secureTextEntry
                  error={errors.confirmPassword}
                />
              </View>
            )}

            {/* Botões */}
            <View style={styles.footer}>
              <Button
                title={loading ? "Salvando..." : "Salvar Alterações"}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={{ backgroundColor: theme.gold, marginBottom: 16 }}
                textStyle={{ color: theme.primary, fontWeight: '900' }}
              />
              
              <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton} activeOpacity={0.8}>
                <Feather name="log-out" size={18} color={theme.danger} />
                <Text style={styles.logoutText}>Sair da Conta</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.versionText}>Kairon Premium v1.0.0</Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: theme.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  backButton: {
    padding: 4,
  },
  
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: theme.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '900',
    color: theme.gold,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.gold,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  userRole: {
    fontSize: 13,
    color: theme.gold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  
  formSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  inputGroup: {
    gap: 16,
  },
  
  changePasswordButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  changePasswordText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  
  passwordContainer: {
    backgroundColor: theme.cardBg,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center'
  },
  passwordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  cancelText: {
    fontSize: 14,
    color: theme.danger,
    fontWeight: '600'
  },
  
  footer: {
    marginTop: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    color: theme.danger,
    fontWeight: '800',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 32,
    fontWeight: '600'
  }
});