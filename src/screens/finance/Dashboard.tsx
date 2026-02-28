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
  useWindowDimensions,
  Modal 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
  info: '#38BDF8',
  tableHeader: '#0B1120',
};

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

interface MonthlyHistoryData {
  id: string; // Ex: '2026-02'
  period: string;
  income: number;
  expense: number;
  profit: number;
  margin: string;
}

// Interface para os registros detalhados do Modal
interface DetailedRecord {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  categoryLabel: string;
  reference?: string;
}

export function FinanceDashboard() {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions(); 
  const { user } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('day');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const [tableFilter, setTableFilter] = useState<'WEEK' | 'MONTH'>('MONTH');

  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0, totalExpenses: 0, netProfit: 0, appointmentsCount: 0, averageTicket: 0,
  });

  const [revenueData, setRevenueData] = useState<RevenueData>({ labels: [], values: [] });
  const [pieData, setPieData] = useState<any[]>([]); 
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryData[]>([]);

  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [totalExpensesCount, setTotalExpensesCount] = useState(0);

  // 👇 ESTADOS DO MODAL DE DETALHES 👇
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState('');
  const [monthDetails, setMonthDetails] = useState<DetailedRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const isCurrentPeriodLocked = user?.plan !== 'PLUS' && period !== 'day';

  const loadData = useCallback(async () => {
    if (isCurrentPeriodLocked) {
        setSummary({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, appointmentsCount: 0, averageTicket: 0 });
        setRevenueData({ labels: [], values: [] });
        setPieData([]);
        setExpenseChartData([]);
        setMonthlyHistory([]);
        setLoading(false);
        setRefreshing(false);
        return;
    }

    try {
      setLoading(true);
      
      const [dashboard, expenses, historyData] = await Promise.all([
        financeService.getDashboard({ period }),
        user?.plan === 'PLUS' ? financeService.getExpensesChart({ period }) : Promise.resolve([]),
        user?.plan === 'PLUS' ? (tableFilter === 'WEEK' ? financeService.getWeeklyHistory() : financeService.getMonthlyHistory()) : Promise.resolve([])
      ]);
      
      setSummary({
        totalRevenue: dashboard.revenue || 0,
        totalExpenses: dashboard.expenses || 0,
        netProfit: dashboard.balance || 0,
        appointmentsCount: dashboard.appointmentCount || 0,
        averageTicket: dashboard.averageTicket || 0,
      });

      setMonthlyHistory(historyData); 

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
  }, [period, user?.plan, isCurrentPeriodLocked, tableFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // 👇 NOVA FUNÇÃO PARA ALTERAR O FILTRO E BUSCAR DADOS IMEDIATAMENTE 👇
  const handleFilterChange = async (filter: 'WEEK' | 'MONTH') => {
      setTableFilter(filter);
      if (user?.plan !== 'PLUS') return;
      
      try {
          const data = filter === 'WEEK' 
              ? await financeService.getWeeklyHistory() 
              : await financeService.getMonthlyHistory();
          setMonthlyHistory(data);
      } catch(e) {
          console.error(e);
      }
  };

  // 👇 FUNÇÃO PARA ABRIR O MODAL E BUSCAR DETALHES 👇
  const handleOpenDetails = async (monthId: string, monthName: string) => {
      setSelectedMonthName(monthName);
      setDetailsModalVisible(true);
      setLoadingDetails(true);

      try {
          // Busca o extrato completo e filtra apenas os daquele mês (ex: começa com "2026-02")
          const allRecords = await financeService.getRecords();
          const filteredRecords = allRecords.filter((record: any) => record.date.startsWith(monthId));
          setMonthDetails(filteredRecords);
      } catch (error) {
          console.error("Erro ao buscar detalhes:", error);
          Alert.alert("Erro", "Não foi possível carregar os detalhes do mês.");
      } finally {
          setLoadingDetails(false);
      }
  };

  const generatePDF = async () => {
    if (user?.plan !== 'PLUS') {
        Alert.alert("Premium 🏆", "Faça o upgrade para gerar relatórios financeiros em PDF.");
        navigation.navigate('SubscriptionScreen');
        return;
    }

    try {
        setGeneratingPdf(true);

        const dataAtual = new Date().toLocaleDateString('pt-BR');
        let periodoNome = 'Hoje';
        if (period === 'week') periodoNome = 'Desta Semana';
        if (period === 'month') periodoNome = 'Deste Mês';
        if (period === 'year') periodoNome = 'Deste Ano';

        const htmlContent = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; background: #fff; }
                .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 28px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; }
                .subtitle { font-size: 14px; color: #64748B; margin-top: 5px; }
                
                .summary-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .summary-card { background: #F8FAFC; padding: 20px; border-radius: 12px; width: 30%; text-align: center; border: 1px solid #E2E8F0; }
                .summary-card.profit { background: #ECFDF5; border-color: #10B981; }
                .summary-title { font-size: 12px; text-transform: uppercase; color: #64748B; margin-bottom: 8px; font-weight: bold; }
                .summary-value { font-size: 24px; font-weight: 900; color: #0F172A; }
                .profit-value { color: #10B981; }
                .expense-value { color: #EF4444; }
                
                h3 { color: #0F172A; margin-top: 20px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; font-size: 18px; text-transform: uppercase; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                th { background-color: #0F172A; color: #fff; padding: 14px 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
                td { padding: 14px 10px; border-bottom: 1px solid #E2E8F0; color: #334155; }
                tr:nth-child(even) { background-color: #F8FAFC; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                
                .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94A3B8; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">Relatório Financeiro</div>
                <div class="subtitle">Kairon Inteligência de Negócios • Gerado em ${dataAtual}</div>
                <div style="margin-top: 10px; font-weight: bold; color: #D4AF37;">Visão: ${periodoNome}</div>
              </div>

              <div class="summary-container">
                <div class="summary-card">
                  <div class="summary-title">Receita Total</div>
                  <div class="summary-value">${formatCurrency(summary.totalRevenue)}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-title">Despesas</div>
                  <div class="summary-value expense-value">${formatCurrency(summary.totalExpenses)}</div>
                </div>
                <div class="summary-card profit">
                  <div class="summary-title">Lucro Líquido</div>
                  <div class="summary-value profit-value">${formatCurrency(summary.netProfit)}</div>
                </div>
              </div>

              <h3>Histórico Detalhado (Últimos Meses)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th class="text-right">Entradas</th>
                    <th class="text-right">Saídas</th>
                    <th class="text-right">Lucro Líquido</th>
                    <th class="text-center">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyHistory.length > 0 ? monthlyHistory.map(row => `
                    <tr>
                      <td class="bold">${row.period}</td>
                      <td class="text-right" style="color: #10B981;">${formatCurrency(row.income)}</td>
                      <td class="text-right" style="color: #EF4444;">${formatCurrency(row.expense)}</td>
                      <td class="text-right bold">${formatCurrency(row.profit)}</td>
                      <td class="text-center bold" style="color: #D4AF37;">${row.margin}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="5" class="text-center">Sem dados registrados nos últimos meses.</td></tr>'}
                </tbody>
              </table>

              <div class="footer">
                Documento gerado automaticamente pelo aplicativo Kairon.<br/>
                Para dúvidas ou suporte, acesse o aplicativo.
              </div>
            </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Relatório Financeiro Kairon',
            UTI: 'com.adobe.pdf'
        });

    } catch (error) {
        console.error("Erro ao gerar PDF", error);
        Alert.alert("Erro", "Não foi possível gerar o relatório.");
    } finally {
        setGeneratingPdf(false);
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      {(['day', 'week', 'month', 'year'] as Period[]).map((p) => {
        const isActive = period === p;
        const labels = { day: 'Hoje', week: 'Semana', month: 'Mês', year: 'Ano' };
        
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
                    {user?.plan === 'PLUS' ? 'Visão PLUS' : 'Plano Grátis'}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.reportButton} onPress={generatePDF} disabled={generatingPdf} activeOpacity={0.8}>
                {generatingPdf ? (
                    <ActivityIndicator size="small" color={theme.gold} />
                ) : (
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

                  {/* TABELA DETALHADA DE HISTÓRICO */}
                  <View style={styles.tableSection}>
                      <View style={styles.chartHeader}>
                          <Text style={styles.sectionTitle}>Histórico Detalhado</Text>
                          <View style={styles.filterRow}>
                              {/* 👇 BOTÕES ATUALIZADOS AQUI 👇 */}
                              <TouchableOpacity 
                                  style={[styles.filterBtn, tableFilter === 'WEEK' && styles.filterBtnActive]}
                                  onPress={() => handleFilterChange('WEEK')}
                              >
                                  <Text style={[styles.filterBtnText, tableFilter === 'WEEK' && styles.filterBtnTextActive]}>Semanas</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                  style={[styles.filterBtn, tableFilter === 'MONTH' && styles.filterBtnActive]}
                                  onPress={() => handleFilterChange('MONTH')}
                              >
                                  <Text style={[styles.filterBtnText, tableFilter === 'MONTH' && styles.filterBtnTextActive]}>Meses</Text>
                              </TouchableOpacity>
                          </View>
                      </View>

                      <View style={styles.tableContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true}>
                              <View>
                                  <View style={styles.tableHeaderRow}>
                                      <Text style={[styles.tableCellHeader, { width: 140 }]}>Período</Text>
                                      <Text style={[styles.tableCellHeader, { width: 110 }]}>Entradas</Text>
                                      <Text style={[styles.tableCellHeader, { width: 110 }]}>Saídas</Text>
                                      <Text style={[styles.tableCellHeader, { width: 120 }]}>Saldo Líquido</Text>
                                      <Text style={[styles.tableCellHeader, { width: 90, textAlign: 'center' }]}>Margem</Text>
                                      <Text style={[styles.tableCellHeader, { width: 100, textAlign: 'center' }]}>Ação</Text>
                                  </View>

                                  {monthlyHistory.map((row, index) => (
                                      <View key={row.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                          <Text style={[styles.tableCell, { width: 140, fontWeight: '700', color: theme.textPrimary }]}>{row.period}</Text>
                                          <Text style={[styles.tableCell, { width: 110, color: theme.success }]}>{formatCurrency(row.income)}</Text>
                                          <Text style={[styles.tableCell, { width: 110, color: theme.danger }]}>{formatCurrency(row.expense)}</Text>
                                          <Text style={[styles.tableCell, { width: 120, color: theme.gold, fontWeight: '700' }]}>{formatCurrency(row.profit)}</Text>
                                          
                                          <View style={{ width: 90, alignItems: 'center' }}>
                                              <View style={styles.marginBadge}>
                                                  <Text style={styles.marginBadgeText}>{row.margin}</Text>
                                              </View>
                                          </View>

                                          <View style={{ width: 100, alignItems: 'center', justifyContent: 'center' }}>
                                              <TouchableOpacity 
                                                style={styles.actionButton}
                                                onPress={() => handleOpenDetails(row.id, row.period)}
                                              >
                                                  <Text style={styles.actionButtonText}>Detalhes</Text>
                                              </TouchableOpacity>
                                          </View>
                                      </View>
                                  ))}
                              </View>
                          </ScrollView>
                      </View>
                      <Text style={styles.tableHelperText}>Deslize para os lados para ver a tabela completa</Text>
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

      {/* ==========================================
          MODAL DE DETALHES (DRILL-DOWN)
      ========================================== */}
      <Modal
          visible={detailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDetailsModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Detalhes: {selectedMonthName}</Text>
                      <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={{ padding: 4 }}>
                          <Feather name="x" size={24} color={theme.textPrimary} />
                      </TouchableOpacity>
                  </View>

                  {loadingDetails ? (
                      <ActivityIndicator size="large" color={theme.gold} style={{ marginVertical: 40 }} />
                  ) : (
                      <ScrollView style={styles.detailsList} showsVerticalScrollIndicator={false}>
                          {monthDetails.length === 0 ? (
                              <View style={styles.emptyChart}>
                                  <Feather name="inbox" size={40} color={theme.border} />
                                  <Text style={styles.emptyDetailsText}>Nenhuma movimentação neste período.</Text>
                              </View>
                          ) : (
                              monthDetails.map((item) => (
                                  <View key={item.id} style={styles.detailItem}>
                                      <View style={styles.detailItemLeft}>
                                          <View style={[styles.detailIcon, { backgroundColor: item.type === 'revenue' ? theme.success + '15' : theme.danger + '15' }]}>
                                              <Feather 
                                                  name={item.type === 'revenue' ? 'arrow-down-left' : 'arrow-up-right'} 
                                                  size={20} 
                                                  color={item.type === 'revenue' ? theme.success : theme.danger} 
                                              />
                                          </View>
                                          <View style={{ flex: 1 }}>
                                              <Text style={styles.detailItemTitle} numberOfLines={1}>
                                                  {item.categoryLabel} {item.reference && `• ${item.reference}`}
                                              </Text>
                                              <Text style={styles.detailItemDesc} numberOfLines={1}>
                                                  {item.description}
                                              </Text>
                                          </View>
                                      </View>
                                      <Text style={[styles.detailItemValue, { color: item.type === 'revenue' ? theme.success : theme.danger }]}>
                                          {item.type === 'revenue' ? '+ ' : '- '}{formatCurrency(item.amount)}
                                      </Text>
                                  </View>
                              ))
                          )}
                      </ScrollView>
                  )}
              </View>
          </View>
      </Modal>

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

  tableSection: { marginBottom: 24 },
  filterRow: { flexDirection: 'row', backgroundColor: theme.cardBg, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  filterBtnActive: { backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  filterBtnText: { fontSize: 12, color: theme.secondary, fontWeight: '600' },
  filterBtnTextActive: { color: theme.gold, fontWeight: '800' },
  
  tableContainer: { backgroundColor: theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: theme.tableHeader, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  tableCellHeader: { fontSize: 12, fontWeight: '700', color: theme.secondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  tableRowAlt: { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
  tableCell: { fontSize: 14, color: theme.secondary },
  marginBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  marginBadgeText: { color: theme.gold, fontSize: 12, fontWeight: '800' },
  actionButton: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  actionButtonText: { color: theme.info, fontSize: 12, fontWeight: '700' },
  tableHelperText: { textAlign: 'center', fontSize: 11, color: theme.secondary, marginTop: 8, fontStyle: 'italic' },

  // 👇 ESTILOS DO MODAL DE DETALHES 👇
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.primary, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%', minHeight: '50%', borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  detailsList: { paddingBottom: 20 },
  emptyDetailsText: { marginTop: 12, color: theme.secondary, fontSize: 14, fontWeight: '600' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  detailItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  detailIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  detailItemTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  detailItemDesc: { color: theme.secondary, fontSize: 13, fontWeight: '500' },
  detailItemValue: { fontSize: 16, fontWeight: '800' },
});