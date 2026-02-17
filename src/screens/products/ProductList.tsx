import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Image,
  Dimensions,
  Modal, 
  Alert  
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button'; 
import { EmptyState } from '../../components/shared/EmptyState';

import { productService, Product } from '../../services/products';
import { useAuth } from '../../contexts/AuthContext';

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
  warning: '#F59E0B',
  border: 'rgba(255, 255, 255, 0.05)',
};

type ProductTypeFilter = 'RESALE' | 'CONSUMPTION'; 

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export function ProductList() {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); 

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ProductTypeFilter>('RESALE');

  // MODAL DE VENDA
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState('1');
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [selling, setSelling] = useState(false);

  const loadProducts = async () => {
    // @ts-ignore
    const targetCompanyId = user?.companyId || user?.company?.id;

    if (!targetCompanyId) return;

    try {
        if (!refreshing) setLoading(true);
        const data = await productService.list(targetCompanyId);
        setProducts(data);
    } catch (error) {
        console.error("Erro ao carregar:", error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, [user]));

  const onRefresh = () => { setRefreshing(true); loadProducts(); };

  // ==============================================================================
  // ⚡ LÓGICA DE VENDA (Revenda)
  // ==============================================================================
  const handleOpenSellModal = (product: Product) => {
    if (product.type === 'CONSUMPTION') {
        return Alert.alert("Aviso", "Item de uso interno não pode ser vendido.");
    }
    if (product.stockQuantity <= 0) {
        return Alert.alert("Esgotado", "Sem estoque disponível.");
    }
    setSelectedProduct(product);
    setSellQty('1');
    setClientName('');
    setPaymentMethod('PIX');
    setSellModalVisible(true);
  };

  const handleConfirmSale = async () => {
    if (!selectedProduct) return;
    const qtd = parseInt(sellQty);

    if (!qtd || qtd <= 0) return Alert.alert("Erro", "Quantidade inválida");
    if (qtd > selectedProduct.stockQuantity) return Alert.alert("Erro", "Estoque insuficiente.");

    try {
        setSelling(true);

        const paymentEnum = paymentMethod === 'CARTAO' ? 'CREDIT_CARD' : 
                            paymentMethod === 'DINHEIRO' ? 'CASH' : 'PIX';

        await productService.sell(selectedProduct.id, {
            quantity: qtd,
            clientName: clientName || "Cliente Balcão",
            paymentMethod: paymentEnum
        });

        Alert.alert("Sucesso", "Venda realizada! Estoque e Caixa atualizados.");
        setSellModalVisible(false);
        loadProducts(); 

    } catch (error: any) {
        console.error("Erro na Venda:", error.response?.data || error.message);
        
        // 👇 A MÁGICA DO UPSELL NA VENDA
        const errorMessage = error.response?.data?.message || "";
        if (errorMessage.includes("plano PLUS") || errorMessage.includes("upgrade")) {
            setSellModalVisible(false);
            navigation.navigate('SubscriptionScreen');
            return;
        }

        Alert.alert("Erro", "Falha ao registrar venda. Verifique os dados.");
    } finally {
        setSelling(false);
    }
  };

  // ==============================================================================
  // ⚡ LÓGICA DE CONSUMO RÁPIDO (Uso Interno)
  // ==============================================================================
  const handleConsumeProduct = (product: Product) => {
    if (product.stockQuantity <= 0) {
        return Alert.alert("Esgotado", "Você não tem mais este item no estoque.");
    }

    Alert.alert(
        "Atenção",
        `Deseja usar 1 unidade de ${product.name}? Isso será descontado do seu estoque automaticamente.`,
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Confirmar",
                onPress: async () => {
                    try {
                        setLoading(true);
                        
                        // @ts-ignore
                        const targetCompanyId = user?.companyId || user?.company?.id;
                        
                        const payload = {
                            name: product.name,
                            type: product.type,
                            costPrice: product.costPrice || 0,
                            salePrice: product.salePrice || 0,
                            stockQuantity: product.stockQuantity - 1,
                            minStockLevel: product.minStockLevel || 0,
                            companyId: targetCompanyId, 
                            barcode: product.barcode || undefined,
                            photoUrl: product.photoUrl || undefined
                        };
                        
                        // @ts-ignore
                        await productService.update(product.id, payload);
                        Alert.alert("Sucesso", "1 unidade descontada do estoque.");
                        loadProducts(); 
                    } catch (error: any) {
                        console.error("Erro no Update de Estoque:", error.response?.data || error.message);
                        
                        // 👇 A MÁGICA DO UPSELL NO USO INTERNO
                        const errorMessage = error.response?.data?.message || "";
                        if (errorMessage.includes("plano PLUS") || errorMessage.includes("upgrade")) {
                            // Redireciona na hora pra tela de assinatura
                            navigation.navigate('SubscriptionScreen');
                            return;
                        }

                        Alert.alert("Erro", "Não foi possível atualizar o estoque.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const filteredProducts = products.filter(p => 
    p.type === activeTab && 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= item.minStockLevel;
    const isOutOfStock = item.stockQuantity === 0;

    return (
        <View style={styles.cardWrapper}> 
            <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CreateProduct', { product: item })} 
            >
                <View style={styles.imageContainer}>
                    {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Feather name="package" size={32} color={theme.textSecondary} />
                        </View>
                    )}
                    {(isLowStock || isOutOfStock) && (
                        <View style={[styles.stockBadge, isOutOfStock ? { backgroundColor: theme.danger } : { backgroundColor: theme.warning }]}>
                            <Text style={styles.stockBadgeText}>{isOutOfStock ? 'ESGOTADO' : 'BAIXO'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.label}>{item.type === 'RESALE' ? 'Venda' : 'Custo'}</Text>
                            <Text style={[styles.price, item.type === 'RESALE' ? { color: theme.success } : { color: theme.textSecondary }]}>
                                {formatCurrency(item.type === 'RESALE' ? (item.salePrice || 0) : item.costPrice)}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.label}>Estoque</Text>
                            <Text style={[styles.stockValue, (isLowStock || isOutOfStock) ? { color: theme.danger } : { color: theme.textPrimary }]}>
                                {item.stockQuantity} un
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {item.type === 'RESALE' && !isOutOfStock && (
                <TouchableOpacity 
                    style={styles.actionButtonSuccess} 
                    onPress={() => handleOpenSellModal(item)}
                >
                    <Feather name="shopping-cart" size={16} color={theme.primary} />
                    <Text style={styles.actionButtonTextDark}>VENDER</Text>
                </TouchableOpacity>
            )}

            {item.type === 'CONSUMPTION' && !isOutOfStock && (
                <TouchableOpacity 
                    style={styles.actionButtonGold} 
                    onPress={() => handleConsumeProduct(item)}
                >
                    <Feather name="minus-circle" size={16} color={theme.primary} />
                    <Text style={styles.actionButtonTextDark}>USAR 1 UNID.</Text>
                </TouchableOpacity>
            )}

            {isOutOfStock && (
                <View style={styles.actionButtonDisabled}>
                    <Feather name="x-circle" size={16} color={theme.textSecondary} />
                    <Text style={styles.actionButtonTextDisabled}>SEM ESTOQUE</Text>
                </View>
            )}
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <View style={styles.header}>
         <View style={styles.headerTop}>
             <Text style={styles.headerTitle}>Estoque</Text>
             <TouchableOpacity 
                style={styles.btnNew}
                onPress={() => navigation.navigate('CreateProduct')}
             >
                 <Feather name="plus" size={20} color={theme.primary} />
                 <Text style={styles.btnNewText}>Novo</Text>
             </TouchableOpacity>
         </View>

         <Input
            placeholder="Buscar produto..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
            containerStyle={{ marginBottom: 16 }}
         />

         <View style={styles.tabsContainer}>
             <TouchableOpacity style={[styles.tab, activeTab === 'RESALE' && styles.tabActive]} onPress={() => setActiveTab('RESALE')}>
                 <Feather name="shopping-bag" size={16} color={activeTab === 'RESALE' ? theme.gold : theme.textSecondary} />
                 <Text style={[styles.tabText, activeTab === 'RESALE' && styles.tabTextActive]}>Revenda</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.tab, activeTab === 'CONSUMPTION' && styles.tabActive]} onPress={() => setActiveTab('CONSUMPTION')}>
                 <Feather name="tool" size={16} color={activeTab === 'CONSUMPTION' ? theme.gold : theme.textSecondary} />
                 <Text style={[styles.tabText, activeTab === 'CONSUMPTION' && styles.tabTextActive]}>Uso Interno</Text>
             </TouchableOpacity>
         </View>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
            <ActivityIndicator size="large" color={theme.gold} style={{ marginTop: 20 }} />
        ) : (
            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={renderProduct}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState icon="inventory" title="Nenhum produto" description="Nada encontrado." />}
            />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={sellModalVisible}
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Vender Produto</Text>
                    <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                        <Feather name="x" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.modalProductName}>{selectedProduct?.name}</Text>
                <Text style={styles.modalPrice}>
                    Unid: {formatCurrency(selectedProduct?.salePrice || 0)}
                </Text>

                <View style={{ gap: 12, marginTop: 16 }}>
                    <Input 
                        label="Quantidade" 
                        value={sellQty} 
                        onChangeText={setSellQty} 
                        keyboardType="numeric" 
                    />
                    
                    <Input 
                        label="Nome do Cliente (Opcional)" 
                        placeholder="Ex: João Silva"
                        placeholderTextColor={theme.textSecondary}
                        value={clientName} 
                        onChangeText={setClientName} 
                    />

                    <View>
                        <Text style={styles.paymentLabel}>Forma de Pagamento</Text>
                        <View style={styles.paymentRow}>
                            {['PIX', 'DINHEIRO', 'CARTAO'].map((method) => (
                                <TouchableOpacity 
                                    key={method}
                                    style={[styles.payBtn, paymentMethod === method && styles.payBtnActive]}
                                    onPress={() => setPaymentMethod(method)}
                                >
                                    <Text style={[styles.payText, paymentMethod === method && styles.payTextActive]}>
                                        {method === 'CARTAO' ? 'CARTÃO' : method}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>TOTAL A RECEBER</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency((selectedProduct?.salePrice || 0) * (parseInt(sellQty) || 0))}
                        </Text>
                    </View>

                    <Button 
                        title={selling ? "Processando..." : "CONFIRMAR VENDA"} 
                        onPress={handleConfirmSale} 
                        loading={selling}
                        style={{ backgroundColor: theme.gold, marginTop: 8 }}
                        textStyle={{ color: theme.primary, fontWeight: '900' }}
                    />
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: theme.textPrimary },
  btnNew: { backgroundColor: theme.gold, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
  btnNewText: { color: theme.primary, fontWeight: '800', fontSize: 14 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  tabActive: { backgroundColor: theme.cardBg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3 },
  tabText: { fontWeight: '600', color: theme.textSecondary, fontSize: 13 },
  tabTextActive: { color: theme.gold },
  
  content: { flex: 1, backgroundColor: '#0B1120', paddingHorizontal: 16, paddingTop: 16 },
  
  cardWrapper: { width: COLUMN_WIDTH, marginBottom: 16 },
  
  card: { backgroundColor: theme.cardBg, borderRadius: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imageContainer: { height: 120, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { opacity: 0.5 },
  stockBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, height: 38 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  label: { fontSize: 10, color: theme.textSecondary, marginBottom: 2, fontWeight: '600', textTransform: 'uppercase' },
  price: { fontSize: 14, fontWeight: '800' },
  stockValue: { fontSize: 14, fontWeight: '800' },

  actionButtonSuccess: { backgroundColor: theme.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, gap: 6 },
  actionButtonGold: { backgroundColor: theme.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, gap: 6 },
  actionButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, gap: 6, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0 },
  actionButtonTextDark: { color: theme.primary, fontSize: 12, fontWeight: '900' },
  actionButtonTextDisabled: { color: theme.textSecondary, fontSize: 12, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 450, borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  modalProductName: { fontSize: 16, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' },
  modalPrice: { fontSize: 16, color: theme.success, fontWeight: '800' },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8, marginTop: 4 },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  payBtnActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: theme.gold },
  payText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
  payTextActive: { color: theme.gold },
  
  totalBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 16, alignItems: 'center', marginVertical: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  totalLabel: { fontSize: 12, color: theme.success, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  totalValue: { fontSize: 32, color: theme.success, fontWeight: '900' }
});