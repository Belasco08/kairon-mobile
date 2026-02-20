import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert,
  Image,
  useWindowDimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';

import { financeService } from '../../services/finance';
import { PremiumGate } from '../../components/PremiumGate';
import { useAuth } from '../../contexts/AuthContext';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM (Dark Mode Total)
// ==============================================================================
const theme = {
  primary: '#0F172A',
  cardBg: '#1E293B',
  gold: '#D4AF37',
  goldLight: '#FDE68A',
  secondary: '#94A3B8',
  textPrimary: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.05)', 
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

// PALETA ESTENDIDA
const CHART_COLORS = [
  '#D4AF37', '#38BDF8', '#10B981', '#F472B6', '#A78BFA', '#F59E0B', 
  '#818CF8', '#FB7185', '#34D399', '#60A5FA', '#FBBF24', '#C084FC',
  '#F87171', '#4ADE80', '#2DD4BF', '#FBB6CE', '#81E6D9', '#D6BCFA',
  '#FCD34D', '#94A3B8'
];

type Period = 'day' | 'week' | 'month' | 'year';

interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  appointmentsCount: number;
  averageTicket: number;
}

interface RevenueData {
  labels: string[];
  values: number[];
}

export function FinanceDashboard() {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions(); 
  const { user } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('day');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0, totalExpenses: 0, netProfit: 0, appointmentsCount: 0, averageTicket: 0,
  });

  const [revenueData, setRevenueData] = useState<RevenueData>({ labels: [], values: [] });
  const [pieData, setPieData] = useState<any[]>([]); 
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);

  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [totalExpensesCount, setTotalExpensesCount] = useState(0);

  // 👇 AGORA BLOQUEIA TUDO QUE NÃO SEJA O 'DAY' (HOJE)
  const isCurrentPeriodLocked = user?.plan !== 'PLUS' && period !== 'day';

  const loadData = useCallback(async () => {
    if (isCurrentPeriodLocked) {
        setSummary({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, appointmentsCount: 0, averageTicket: 0 });
        setRevenueData({ labels: [], values: [] });
        setPieData([]);
        setExpenseChartData([]);
        setLoading(false);
        setRefreshing(false);
        return;
    }

    try {
      setLoading(true);
      
      const [dashboard, expenses] = await Promise.all([
        financeService.getDashboard({ period }),
        user?.plan === 'PLUS' ? financeService.getExpensesChart({ period }) : Promise.resolve([])
      ]);
      
      setSummary({
        totalRevenue: dashboard.revenue || 0,
        totalExpenses: dashboard.expenses || 0,
        netProfit: dashboard.balance || 0,
        appointmentsCount: dashboard.appointmentCount || 0,
        averageTicket: dashboard.averageTicket || 0,
      });

      const evolution = dashboard.dailyEvolution || [];
      const rawLabels = evolution.map((item: any) => {
          const parts = item.date.split('-');
          return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
      });
      const values = evolution.map((item: any) => item.revenue);

      const step = Math.max(1, Math.ceil(rawLabels.length / 6)); 
      const cleanLabels = rawLabels.map((label: string, index: number) => 
          (index % step === 0 || index === rawLabels.length - 1) ? label : ""
      );

      setRevenueData({
        labels: cleanLabels.length > 0 ? cleanLabels : ["0"],
        values: values.length > 0 ? values : [0],
      });

      let totalCount = 0;
      const formattedPie = (dashboard.topServices || []).map((item: any, index: number) => {
        totalCount += item.count;
        return {
          name: item.serviceName,
          population: item.count,
          color: CHART_COLORS[index % CHART_COLORS.length],
          legendFontColor: theme.secondary,
          legendFontSize: 12,
        };
      });
      setTotalServicesCount(totalCount);
      setPieData(formattedPie);

      if (expenses && expenses.length > 0) {
          let totalExp = 0;
          const formattedExpenses = expenses.map((item: any, index: number) => {
            const val = item.total || 0; 
            totalExp += val;
            return {
              name: item.category, 
              population: val,     
              color: CHART_COLORS[(index + 5) % CHART_COLORS.length], 
              legendFontColor: theme.secondary,
              legendFontSize: 12,
            };
          });
          setTotalExpensesCount(totalExp);
          setExpenseChartData(formattedExpenses);
      } else {
          setExpenseChartData([]); 
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, user?.plan, isCurrentPeriodLocked]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const generatePDF = async () => {
     if (user?.plan !== 'PLUS') {
         Alert.alert("Premium 🏆", "Faça o upgrade para gerar relatórios financeiros em PDF com a logo da sua empresa.");
         navigation.navigate('SubscriptionScreen');
         return;
     }
     setGeneratingPdf(true);
     setTimeout(() => {
         setGeneratingPdf(false);
         Alert.alert("Sucesso", "Relatório gerado com sucesso!");
     }, 2000); 
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      {(['day', 'week', 'month', 'year'] as Period[]).map((p) => {
        const isActive = period === p;
        const labels = { day: 'Hoje', week: 'Semana', month: 'Mês', year: 'Ano' };
        
        // 👇 AGORA BLOQUEIA TODOS, EXCETO O 'DAY'
        const isLocked = user?.plan !== 'PLUS' && p !== 'day';

        return (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)} 
            style={[styles.periodButton, isActive && styles.periodButtonActive]}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[
                    styles.periodText, 
                    isActive && styles.periodTextActive,
                    isLocked && { color: theme.secondary, opacity: 0.8 } 
                ]}>
                {labels[p]}
                </Text>
                {isLocked && <MaterialCommunityIcons name="lock" size={12} color={theme.gold} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStatCard = (title: string, value: string, icon: any, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <View style={{ marginTop: 16 }}>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      </View>
    </View>
  );

  const renderCustomLegend = (data: any[], totalValue: number, isCurrency: boolean = false) => (
    <View style={styles.legendContainer}>
      {data.map((item, index) => {
        const percentage = totalValue > 0 ? ((item.population / totalValue) * 100).toFixed(1) : 0;
        const valueText = isCurrency ? formatCurrency(item.population) : `${item.population} un.`;
        let displayName = item.name ? item.name.replace(/_/g, ' ') : 'Outros';
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

        return (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>{displayName}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendCount}>{valueText}</Text>
              <View style={styles.badge}>
                 <Text style={styles.badgeText}>{percentage}%</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold} />}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Painel Financeiro</Text>
                <Text style={styles.headerSubtitle}>
                    {user?.plan === 'PLUS' ? 'Visão PRO 🏆' : 'Plano Grátis'}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.reportButton} onPress={generatePDF} disabled={generatingPdf} activeOpacity={0.8}>
                {generatingPdf ? (
                    <ActivityIndicator size="small" color={theme.gold} />
                ) : (
                    /* 👇 ICONE DE PDF CORRIGIDO AQUI 👇 */
                    <MaterialCommunityIcons name="file-pdf-box" size={26} color={theme.gold} />
                )}
              </TouchableOpacity>
            </View>

            {/* SELETOR DE PERÍODO */}
            <View style={{ marginBottom: 10 }}>
                {renderPeriodSelector()}
            </View>
          </View> 

          {/* BARREIRA PREMIUM */}
          {isCurrentPeriodLocked ? (
              <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                  <PremiumGate description="Visão de longo prazo é o segredo das grandes empresas. Libere o plano PLUS para acessar a visão Semanal, Mensal e Anual, além de relatórios detalhados em PDF.">
                      <View style={{ height: 400, backgroundColor: theme.cardBg, borderRadius: 24 }} />
                  </PremiumGate>
              </View>
          ) : (
              <View style={styles.mainContent}>
                  {/* LUCRO EM DESTAQUE */}
                  <View style={styles.mainBalanceCard}>
                      <Image 
                          source={require('../../assets/images/logo.png')} 
                          style={styles.watermarkLogo} 
                          resizeMode="contain"
                      />
                      
                      <Text style={styles.mainBalanceLabel}>Resultado Líquido</Text>
                      <Text style={styles.mainBalanceValue}>{formatCurrency(summary.netProfit)}</Text>
                  </View>

                  {/* GRID DE CARDS */}
                  <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        {renderStatCard('Receita', formatCurrency(summary.totalRevenue), 'arrow-up-circle', theme.success)}
                        {renderStatCard('Despesas', formatCurrency(summary.totalExpenses), 'arrow-down-circle', theme.danger)}
                    </View>
                    <View style={styles.gridRow}>
                        {renderStatCard('Atendimentos', summary.appointmentsCount.toString(), 'users', theme.gold)}
                        {renderStatCard('Ticket Médio', formatCurrency(summary.averageTicket), 'bar-chart-2', theme.goldLight)}
                    </View>
                  </View>

                  {/* GRÁFICO 1: EVOLUÇÃO */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.sectionTitle}>Fluxo de Caixa</Text>
                        <Feather name="activity" size={20} color={theme.gold} />
                    </View>
                    
                    {revenueData.values.length > 0 && !revenueData.values.every(v => v === 0) ? (
                        <LineChart
                        data={{ labels: revenueData.labels, datasets: [{ data: revenueData.values }] }}
                        width={screenWidth - 56} 
                        height={220}
                        yAxisLabel="R$" yAxisSuffix=""
                        withInnerLines={true} withOuterLines={false} withVerticalLines={false}
                        chartConfig={{
                            backgroundColor: theme.cardBg, 
                            backgroundGradientFrom: theme.cardBg, 
                            backgroundGradientTo: theme.cardBg,
                            decimalPlaces: 0, 
                            color: (opacity = 1) => `rgba(212, 175, 55, ${opacity})`, 
                            labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                            propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary },
                            propsForBackgroundLines: { strokeDasharray: "", stroke: 'rgba(255,255,255,0.05)' }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                        <Feather name="bar-chart-2" size={40} color={theme.border} />
                        <Text style={styles.emptyChartText}>Sem dados no período.</Text>
                        </View>
                    )}
                  </View>

                  {/* GRÁFICO 2: DESPESAS */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.sectionTitle}>Para onde vai o dinheiro?</Text>
                        <Feather name="pie-chart" size={20} color={theme.danger} />
                    </View>

                    <PremiumGate description="Veja exatamente onde você está gastando e aumente seu lucro com o gerenciador de despesas.">
                        {expenseChartData.length > 0 ? (
                            <View style={{ alignItems: 'center' }}>
                            <PieChart
                                data={expenseChartData}
                                width={screenWidth - 48} 
                                height={220}
                                chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                                accessor={"population"} backgroundColor={"transparent"}
                                paddingLeft={"15"} center={[0, 0]} absolute={false} hasLegend={false}
                            />
                            {renderCustomLegend(expenseChartData, totalExpensesCount, true)}
                            </View>
                        ) : (
                            <View style={styles.emptyChart}>
                            <Feather name="dollar-sign" size={40} color={theme.border} />
                            <Text style={styles.emptyChartText}>Sem despesas registradas.</Text>
                            </View>
                        )}
                    </PremiumGate>
                  </View>

                  {/* GRÁFICO 3: SERVIÇOS */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.sectionTitle}>Serviços Principais</Text>
                        <Feather name="star" size={20} color={theme.gold} />
                    </View>
                    {pieData.length > 0 ? (
                        <View style={{ alignItems: 'center' }}>
                        <PieChart
                            data={pieData}
                            width={screenWidth - 48} 
                            height={220}
                            chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                            accessor={"population"} backgroundColor={"transparent"}
                            paddingLeft={"15"} center={[0, 0]} absolute={false} hasLegend={false}
                        />
                        {renderCustomLegend(pieData, totalServicesCount, false)}
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Feather name="scissors" size={40} color={theme.border} />
                            <Text style={styles.emptyChartText}>Nenhum serviço realizado.</Text>
                        </View>
                    )}
                  </View>

              </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary },
  
  headerContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20, marginBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.goldLight, marginTop: 4, fontWeight: '600' },
  
  reportButton: { 
      backgroundColor: 'rgba(212, 175, 55, 0.15)', 
      width: 44, 
      height: 44, 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: 'rgba(212, 175, 55, 0.3)',
      alignItems: 'center',
      justifyContent: 'center'
  },
  
  mainBalanceCard: { 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 30,
      marginBottom: 24,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderWidth: 1,
      borderColor: theme.border
  },
  watermarkLogo: {
      position: 'absolute',
      width: 150,
      height: 150,
      opacity: 0.05,
      tintColor: theme.gold,
      transform: [{ rotate: '-15deg' }]
  },
  mainBalanceLabel: { fontSize: 13, color: theme.secondary, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
  mainBalanceValue: { fontSize: 42, fontWeight: '900', color: theme.gold, marginTop: 8 }, 
  
  periodContainer: { flexDirection: 'row', backgroundColor: theme.cardBg, borderRadius: 16, padding: 6, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  periodButtonActive: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  periodText: { fontSize: 13, fontWeight: '600', color: theme.secondary },
  periodTextActive: { color: theme.gold, fontWeight: '800' },
  
  mainContent: { paddingHorizontal: 20, paddingTop: 10 },
  gridContainer: { gap: 16, marginBottom: 24 },
  gridRow: { flexDirection: 'row', gap: 16 },
  
  statCard: { flex: 1, backgroundColor: theme.cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.border },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  statLabel: { fontSize: 13, color: theme.secondary, marginBottom: 6, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800' },
  
  chartCard: { backgroundColor: theme.cardBg, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { marginTop: 12, color: theme.secondary, fontSize: 14, fontWeight: '600' },
  
  legendContainer: { marginTop: 24, width: '100%' },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  legendColorBox: { width: 12, height: 12, borderRadius: 4, marginRight: 12 },
  legendText: { fontSize: 14, color: theme.textPrimary, fontWeight: '600' },
  legendRight: { flexDirection: 'row', alignItems: 'center' },
  legendCount: { fontSize: 13, color: theme.secondary, marginRight: 12, fontWeight: '500' },
  
  badge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.border },
  badgeText: { fontSize: 11, fontWeight: '800', color: theme.goldLight },
});