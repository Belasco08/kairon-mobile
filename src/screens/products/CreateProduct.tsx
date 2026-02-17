import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PremiumGate } from '../../components/PremiumGate'; 
import { useAuth } from '../../contexts/AuthContext'; 

import { productService, Product } from '../../services/products';

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

type ProductType = 'RESALE' | 'CONSUMPTION';

export function CreateProduct() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { user } = useAuth();
  // @ts-ignore
  const companyId = user?.companyId || user?.company?.id;

  const productToEdit = (route.params as any)?.product as Product | undefined;
  const isEditing = !!productToEdit;

  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState(productToEdit?.name || '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');
  const [type, setType] = useState<ProductType>(productToEdit?.type || 'RESALE');
  
  const [costPrice, setCostPrice] = useState(productToEdit?.costPrice ? String(productToEdit.costPrice).replace('.', ',') : '');
  const [salePrice, setSalePrice] = useState(productToEdit?.salePrice ? String(productToEdit.salePrice).replace('.', ',') : '');
  const [stockQuantity, setStockQuantity] = useState(productToEdit?.stockQuantity ? String(productToEdit.stockQuantity) : '');
  const [minStockLevel, setMinStockLevel] = useState(productToEdit?.minStockLevel ? String(productToEdit.minStockLevel) : '5');

  const [photo, setPhoto] = useState<string | null>(productToEdit?.photoUrl || null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para escolher a foto.');
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhoto(base64Img);
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(costPrice.replace(',', '.')) || 0;
    const sale = parseFloat(salePrice.replace(',', '.')) || 0;
    
    if (cost > 0 && sale > 0) {
      const profit = sale - cost;
      const margin = (profit / sale) * 100;
      return { profit, margin };
    }
    return null;
  };

  const marginData = calculateMargin();

  const handleDelete = async () => {
    Alert.alert("Excluir Produto", "Tem certeza? Isso não pode ser desfeito.", [
        { text: "Cancelar", style: "cancel" },
        { 
            text: "Excluir", 
            style: "destructive", 
            onPress: async () => {
                try {
                    setLoading(true);
                    if (productToEdit?.id) {
                        await productService.delete(productToEdit.id);
                        Alert.alert("Sucesso", "Produto excluído.");
                        navigation.goBack();
                    }
                } catch (error) {
                    Alert.alert("Erro", "Não foi possível excluir.");
                } finally {
                    setLoading(false);
                }
            }
        }
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Atenção", "Nome obrigatório.");
    if (!costPrice) return Alert.alert("Atenção", "Preço de custo obrigatório.");
    if (!companyId) return Alert.alert("Erro", "Empresa não identificada.");

    try {
      setLoading(true);
      
      const payload = {
        name,
        barcode,
        type,
        costPrice: parseFloat(costPrice.replace(',', '.')),
        salePrice: type === 'RESALE' ? parseFloat(salePrice.replace(',', '.')) : undefined,
        stockQuantity: parseInt(stockQuantity) || 0,
        minStockLevel: parseInt(minStockLevel) || 5,
        companyId: companyId,
        photoUrl: photo || undefined
      };

      if (isEditing && productToEdit?.id) {
          await productService.update(productToEdit.id, payload);
          Alert.alert("Sucesso", "Produto atualizado!");
      } else {
          await productService.create(payload);
          Alert.alert("Sucesso", "Produto criado!");
      }
      navigation.goBack();

    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  const estimatedExpense = ((parseFloat(costPrice.replace(',', '.') || '0')) * (parseInt(stockQuantity || '0'))).toFixed(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={theme.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Produto' : 'Novo Produto'}</Text>
            {isEditing ? (
                <TouchableOpacity onPress={handleDelete} style={styles.backButton}>
                    <Feather name="trash-2" size={22} color={theme.danger} />
                </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}
        </View>

        {/* 🛑 TRAVA PREMIUM APLICADA AQUI */}
        <PremiumGate description="O controle de estoque e venda de produtos é exclusivo para assinantes Plus.">
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
            
            <View style={styles.photoSection}>
                <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                    {photo ? (
                        <Image source={{ uri: photo }} style={styles.photo} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Feather name="camera" size={32} color={theme.gold} />
                            <Text style={styles.photoText}>Foto</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {photo && (
                    <TouchableOpacity onPress={() => setPhoto(null)} style={{ marginTop: 12 }}>
                        <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '600' }}>Remover foto</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações</Text>
                <View style={styles.card}>
                    {/* 👇 OBS: Se o seu Input ficar com texto escuro invisível no fundo azul, me avise que eu ajusto! */}
                    <Input label="Nome *" value={name} onChangeText={setName} />
                    <Input label="Código de Barras" value={barcode} onChangeText={setBarcode} keyboardType="numeric" />

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Tipo de Produto</Text>
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity style={[styles.toggleBtn, type === 'RESALE' && styles.toggleBtnActive]} onPress={() => setType('RESALE')}>
                                <Text style={[styles.toggleText, type === 'RESALE' && styles.toggleTextActive]}>Venda</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.toggleBtn, type === 'CONSUMPTION' && styles.toggleBtnActive]} onPress={() => setType('CONSUMPTION')}>
                                <Text style={[styles.toggleText, type === 'CONSUMPTION' && styles.toggleTextActive]}>Uso Interno</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financeiro</Text>
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Input label="Custo (R$)" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" placeholder="0,00" />
                        </View>
                        {type === 'RESALE' && (
                            <View style={{ flex: 1 }}>
                                <Input label="Venda (R$)" value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" placeholder="0,00" />
                            </View>
                        )}
                    </View>

                    {type === 'RESALE' && marginData && (
                        <View style={[styles.marginCard, marginData.margin < 30 ? styles.marginCardDanger : styles.marginCardSuccess]}>
                            <Text style={[styles.marginLabel, marginData.margin < 30 ? {color: theme.danger} : {color: theme.success}]}>
                                Lucro: R$ {marginData.profit.toFixed(2)}
                            </Text>
                            <Text style={[styles.marginValue, marginData.margin < 30 ? { color: theme.danger } : { color: theme.success }]}>
                                {marginData.margin.toFixed(1)}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estoque</Text>
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Input label="Qtd Atual" value={stockQuantity} onChangeText={setStockQuantity} keyboardType="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Input label="Mínimo" value={minStockLevel} onChangeText={setMinStockLevel} keyboardType="numeric" />
                        </View>
                    </View>
                    
                    {!isEditing && parseInt(stockQuantity || '0') > 0 && (
                        <View style={styles.infoBox}>
                            <Feather name="info" size={18} color={theme.gold} style={{marginTop: 2}} />
                            <Text style={styles.infoText}>
                                Ao salvar, uma despesa de <Text style={{fontWeight:'800', color: theme.textPrimary}}>R$ {estimatedExpense}</Text> será lançada no seu fluxo de caixa hoje.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <Button 
              title={loading ? "Processando..." : "Salvar Produto"} 
              onPress={handleSave} 
              loading={loading} 
              disabled={loading} 
              style={{ marginTop: 10, marginBottom: 40 }} 
            />

            </ScrollView>
        </PremiumGate>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: theme.primary, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    backButton: { padding: 4 },
    
    photoSection: { alignItems: 'center', marginBottom: 24 },
    photoButton: { width: 120, height: 120, borderRadius: 16, backgroundColor: 'rgba(212, 175, 55, 0.05)', borderWidth: 1.5, borderColor: theme.gold, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    photoPlaceholder: { alignItems: 'center', gap: 8 },
    photoText: { fontSize: 13, color: theme.gold, fontWeight: '700' },
    photo: { width: '100%', height: '100%' },
    
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.gold, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 16 },
    
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    switchLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 },
    toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
    toggleBtnActive: { backgroundColor: theme.gold, shadowColor: theme.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 3 },
    toggleText: { fontSize: 13, color: theme.textSecondary, fontWeight: '700' },
    toggleTextActive: { color: theme.primary },
    
    marginCard: { padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
    marginCardSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
    marginCardDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
    marginLabel: { fontSize: 13, fontWeight: '700' },
    marginValue: { fontSize: 18, fontWeight: '800' },
    
    infoBox: { flexDirection: 'row', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 16, borderRadius: 12, gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
    infoText: { flex: 1, fontSize: 13, color: theme.goldLight, lineHeight: 20 }
});