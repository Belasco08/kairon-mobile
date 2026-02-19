import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
  StatusBar,
  Share // 👈 IMPORTADO AQUI
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

// Ativa animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
// 🟢 WHATSAPP DARK THEME
// ==============================================================================
const waColors = {
  header: '#1F2C34', 
  bg: '#0B141A', 
  bubbleOut: '#005C4B', 
  checkBlue: '#53BDEB',
  textTime: '#8696A0',
  textPrimary: '#E9EDEF',
  inputBg: '#2A3942',
  iconColor: '#8696A0',
  linkBlue: '#53BDEB'
};

const DEFAULT_TEMPLATE = 
`Olá *{CLIENTE}*! 👋
Seu agendamento foi confirmado!

🗓 Data: {DATA}
⏰ Horário: {HORA}
✂️ Profissional: {PROFISSIONAL}
💰 Valor: {VALOR}

📍 Endereço: {ENDERECO}

Te aguardamos na *{EMPRESA}*! 👊`;

export function WhatsAppSettings() {
  const navigation = useNavigation();
  const { user, company, updateUser } = useAuth() as any; 
  
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const targetCompanyId = company?.id || user?.companyId || user?.company?.id;

  // 👇 LINK DE AGENDAMENTO BASEADO NO SLUG
  // Em produção, você troca o localhost pelo seu domínio real (ex: app.kairon.com.br)
  const BASE_WEB_URL = "kairon-web-one.vercel.app/agendar/";
  const companySlug = company?.slug || targetCompanyId || "minha-barbearia";
  const myBookingLink = `${BASE_WEB_URL}${targetCompanyId || "id-da-empresa"}`;

  useEffect(() => {
    loadFreshData();
  }, []);

  const loadFreshData = async () => {
    if (!targetCompanyId) {
        setFetching(false);
        return;
    }
    
    try {
        setFetching(true);
        const response = await api.get(`/companies/${targetCompanyId}`);
        const savedTemplate = response.data.whatsappTemplate;
        
        setTemplate(savedTemplate || DEFAULT_TEMPLATE);
    } catch (error) {
        console.error("Erro ao buscar template:", error);
        setTemplate(company?.whatsappTemplate || DEFAULT_TEMPLATE);
    } finally {
        setFetching(false);
    }
  };

  const changeTab = (tab: 'editor' | 'preview') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Agende seu horário comigo pelo aplicativo:\n${myBookingLink}`,
      });
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível compartilhar o link.");
    }
  };

  const handleSave = async () => {
    if (!targetCompanyId) {
        Alert.alert("Erro", "ID da empresa não encontrado.");
        return;
    }

    try {
      setLoading(true);

      await api.put(`/companies/${targetCompanyId}`, {
        whatsappTemplate: template
      });

      if (updateUser) {
          const updatedUserContext = {
              ...user,
              company: {
                  ...(user.company || {}), 
                  whatsappTemplate: template 
              }
          };
          
          await updateUser(updatedUserContext);
      }
      
      Alert.alert("Sucesso", "Mensagem atualizada!");
      navigation.goBack();

    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate(prev => prev + ` ${variable}`);
  };

  const getPreviewText = () => {
    let msg = template || "";
    const mockData: any = {
        '{CLIENTE}': "João Silva",
        '{DATA}': "12/08",
        '{HORA}': "14:30",
        '{PROFISSIONAL}': user?.name?.split(' ')[0] || "Kairon",
        '{VALOR}': "R$ 50,00",
        '{ENDERECO}': company?.address || "Rua das Flores, 123",
        '{EMPRESA}': company?.name || "Barbearia Kairon"
    };

    Object.keys(mockData).forEach(key => {
        msg = msg.split(key).join(mockData[key]);
    });
    return msg;
  };

  const renderRichText = (text: string) => {
    const parts = text.split(/(\*.*?\*)/g); 
    
    return (
        <Text style={styles.chatText}>
            {parts.map((part, index) => {
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <Text key={index} style={{ fontWeight: 'bold', color: waColors.textPrimary }}>{part.slice(1, -1)}</Text>;
                }
                
                if (part.includes('http')) {
                   const words = part.split(/(\s+)/);
                   return words.map((word, wIndex) => {
                      if (word.startsWith('http')) {
                        return <Text key={`${index}-${wIndex}`} style={{ color: waColors.linkBlue, textDecorationLine: 'underline' }}>{word}</Text>
                      }
                      return <Text key={`${index}-${wIndex}`}>{word}</Text>
                   });
                }
                
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
  };

  const variables = [
    { label: 'Cliente', tag: '{CLIENTE}', icon: 'user' },
    { label: 'Data', tag: '{DATA}', icon: 'calendar' },
    { label: 'Hora', tag: '{HORA}', icon: 'clock' },
    { label: 'Profis.', tag: '{PROFISSIONAL}', icon: 'scissors' },
    { label: 'Valor', tag: '{VALOR}', icon: 'dollar-sign' },
    { label: 'Endereço', tag: '{ENDERECO}', icon: 'map-pin' },
  ];

  if (fetching) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={theme.gold} />
          </View>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                <Feather name="arrow-left" size={24} color={theme.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mensagem Automática</Text>
            <TouchableOpacity onPress={() => setTemplate(DEFAULT_TEMPLATE)} style={styles.headerBtn}>
                <Feather name="rotate-ccw" size={20} color={theme.goldLight} />
            </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'editor' && styles.tabBtnActive]} 
                onPress={() => changeTab('editor')}
                activeOpacity={0.8}
            >
                <Feather name="edit-3" size={16} color={activeTab === 'editor' ? theme.primary : theme.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'editor' && styles.tabTextActive]}>Editor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'preview' && styles.tabBtnActive]} 
                onPress={() => changeTab('preview')}
                activeOpacity={0.8}
            >
                <Feather name="smartphone" size={16} color={activeTab === 'preview' ? theme.primary : theme.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, activeTab === 'preview' && styles.tabTextActive]}>Visualizar</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* ================= EDITOR ================= */}
          {activeTab === 'editor' && (
            <View style={styles.editorContainer}>
                
                {/* 👇 CARD DO LINK DE AGENDAMENTO 👇 */}
                <View style={styles.linkCard}>
                    <View style={styles.linkCardHeader}>
                        <Feather name="link" size={18} color={theme.gold} />
                        <Text style={styles.linkCardTitle}>Seu Link de Agendamento</Text>
                    </View>
                    <Text style={styles.linkCardDesc}>
                        Copie este link e coloque na mensagem de saudação do seu WhatsApp Business, ou no link da bio do seu Instagram!
                    </Text>
                    
                    <View style={styles.linkBoxRow}>
                        <View style={styles.linkBox}>
                            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
                                {myBookingLink}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleShareLink}>
                            <Feather name="share-2" size={18} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* 👆 FIM DO CARD 👆 */}

                <Text style={styles.helperText}>
                    Personalize a mensagem de <Text style={{fontWeight: 'bold', color: theme.textPrimary}}>confirmação de agendamento</Text> usando as tags abaixo:
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variableScroll}>
                    {variables.map((v) => (
                        <TouchableOpacity 
                            key={v.tag} 
                            style={styles.variableChip}
                            onPress={() => insertVariable(v.tag)}
                            activeOpacity={0.7}
                        >
                            <Feather name={v.icon as any} size={14} color={theme.gold} style={{ marginRight: 6 }} />
                            <Text style={styles.variableText}>{v.tag}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.inputWrapper}>
                    <TextInput
                        value={template}
                        onChangeText={setTemplate}
                        multiline
                        textAlignVertical="top"
                        placeholder="Escreva sua mensagem aqui..."
                        placeholderTextColor={theme.textSecondary}
                        style={styles.textInput}
                    />
                    <Text style={styles.charCount}>{template.length} caracteres</Text>
                </View>
            </View>
          )}

          {/* ================= PREVIEW ================= */}
          {activeTab === 'preview' && (
            <View style={styles.previewContainer}>
                <View style={styles.waHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                        <View style={styles.waAvatar}>
                            <Feather name="user" size={20} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.waContactName}>{company?.name || "Minha Empresa"}</Text>
                            <Text style={styles.waStatus}>online</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <Ionicons name="videocam" size={22} color="#fff" />
                        <Ionicons name="call" size={20} color="#fff" />
                        <MaterialCommunityIcons name="dots-vertical" size={22} color="#fff" />
                    </View>
                </View>

                <View style={styles.waBody}>
                    <View style={styles.waDateBadge}>
                        <Text style={styles.waDateText}>Hoje</Text>
                    </View>

                    <View style={styles.waBubble}>
                        <View style={styles.waTriangle} />
                        
                        {renderRichText(getPreviewText())}
                        
                        <View style={styles.waMetadata}>
                            <Text style={styles.waTime}>10:45</Text>
                            <MaterialCommunityIcons name="check-all" size={16} color={waColors.checkBlue} />
                        </View>
                    </View>
                </View>

                <View style={styles.waFooter}>
                    <View style={styles.waInputContainer}>
                        <MaterialCommunityIcons name="emoticon-outline" size={24} color={waColors.iconColor} />
                        <Text style={styles.waPlaceholder}>Mensagem</Text>
                        <View style={{ flexDirection: 'row', gap: 15, marginLeft: 'auto' }}>
                            <MaterialCommunityIcons name="paperclip" size={24} color={waColors.iconColor} />
                            <MaterialCommunityIcons name="camera" size={24} color={waColors.iconColor} />
                        </View>
                    </View>
                    <View style={styles.waMicBtn}>
                        <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
                    </View>
                </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
            <Button
                title={loading ? "Salvando..." : "Salvar Configuração"}
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={{ backgroundColor: theme.gold }}
                textStyle={{ color: theme.primary, fontWeight: '900' }}
            />
        </View>

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
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
  headerBtn: { padding: 8 },

  tabContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12
  },
  tabBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border
  },
  tabBtnActive: {
      backgroundColor: theme.gold,
      borderColor: theme.gold
  },
  tabText: { fontWeight: '700', color: theme.textSecondary },
  tabTextActive: { color: theme.primary },

  content: { paddingHorizontal: 16, paddingBottom: 20 },

  editorContainer: {},
  
  // 👇 ESTILOS DO NOVO CARD DO LINK 👇
  linkCard: {
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  linkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  linkCardTitle: { fontSize: 16, fontWeight: '800', color: theme.gold },
  linkCardDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 18, marginBottom: 16 },
  linkBoxRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  linkBox: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.3)', 
      paddingHorizontal: 14, 
      paddingVertical: 12, 
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)'
  },
  linkText: { color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
  copyBtn: { 
      backgroundColor: theme.gold, 
      width: 44, 
      height: 44, 
      borderRadius: 10, 
      alignItems: 'center', 
      justifyContent: 'center' 
  },
  // 👆 FIM DOS ESTILOS DO CARD 👆

  helperText: { color: theme.textSecondary, marginBottom: 16, fontSize: 13, lineHeight: 20 },
  variableScroll: { marginBottom: 16, height: 44, flexGrow: 0 },
  variableChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 10,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  variableText: { color: theme.gold, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  
  inputWrapper: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      minHeight: 280
  },
  textInput: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
      lineHeight: 24,
      minHeight: 220
  },
  charCount: {
      textAlign: 'right',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 8,
      fontWeight: '600'
  },

  previewContainer: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: waColors.bg,
      height: 550, 
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
  },
  waHeader: {
      backgroundColor: waColors.header,
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  waAvatar: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: '#64748B',
      alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 12
  },
  waContactName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  waStatus: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  
  waBody: { flex: 1, padding: 12 },
  waDateBadge: {
      backgroundColor: '#182229', paddingHorizontal: 12, paddingVertical: 6, 
      borderRadius: 8, alignSelf: 'center', marginBottom: 16
  },
  waDateText: { fontSize: 11, color: '#8696A0', fontWeight: '600', textTransform: 'uppercase' },
  
  waBubble: {
      backgroundColor: waColors.bubbleOut,
      padding: 10,
      paddingRight: 10, 
      borderRadius: 12,
      borderTopRightRadius: 0,
      alignSelf: 'flex-end',
      maxWidth: '85%',
      minWidth: 120
  },
  waTriangle: {
      position: 'absolute',
      top: 0,
      right: -8,
      width: 0,
      height: 0,
      borderTopWidth: 12,
      borderTopColor: waColors.bubbleOut,
      borderRightWidth: 12,
      borderRightColor: 'transparent',
  },
  chatText: { fontSize: 15, color: waColors.textPrimary, lineHeight: 22 },
  waMetadata: {
      flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6, gap: 4
  },
  waTime: { fontSize: 11, color: waColors.textTime },
  
  waFooter: {
      padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: waColors.header
  },
  waInputContainer: {
      flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: waColors.inputBg,
      borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, gap: 10
  },
  waPlaceholder: { color: waColors.iconColor, fontSize: 16 },
  waMicBtn: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: waColors.bubbleOut,
      alignItems: 'center', justifyContent: 'center'
  },

  footer: {
      padding: 20,
      backgroundColor: theme.cardBg,
      borderTopWidth: 1,
      borderTopColor: theme.border
  }
});