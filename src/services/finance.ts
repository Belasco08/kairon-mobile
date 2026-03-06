import { api } from './api';

/* =========================
   TIPOS BASE E INTERFACES
========================= */

export type Period = 'day' | 'week' | 'month' | 'year';

// 👇 Nova Interface para a Tabela de Histórico Mensal
export interface MonthlyHistoryData {
  id: string;
  period: string;
  income: number;
  expense: number;
  profit: number;
  margin: string;
}

export interface DashboardData {
  safeBalance: number;
  upcomingPayables: never[];
  pendingExpenses: number;
  revenue: number;
  expenses: number;
  balance: number;
  appointmentCount: number;
  averageTicket: number;
  dailyEvolution: Array<{
    date: string;
    revenue: number;
    appointmentCount: number;
  }>;
  topServices: Array<{
    serviceName: string;
    revenue: number;
    count: number;
  }>;
  busyHours: Array<{
    hour: string;
    count: number;
  }>;
}

/* =========================
   FINANCIAL RECORD (API - O QUE VEM DO JAVA)
========================= */

export interface ApiFinancialRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE'; 
  category: string;           
  amount: number;
  description: string;
  referenceDate: string;
  status: string;
  paymentMethod: string;
  
  professional?: { name: string };
  clientName?: string;
  appointment?: { 
    id: string; 
    client: { name: string } 
  };
}

/* =========================
   FINANCIAL RECORD (APP - O QUE A TELA USA)
========================= */

export interface FinancialRecord {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: 'appointment' | 'product' | 'service' | 'other'; 
  categoryLabel: string; 
  status: 'pending' | 'completed' | 'cancelled';
  reference?: string; 
}

export interface ExpenseChartData {
  category: string;
  total: number;
}

/* =========================
   DASHBOARD AUX
========================= */

export interface RevenueData {
  labels: string[];
  values: number[];
}

export interface ComparisonData {
  previousPeriodRevenue: number;
  growthPercentage: number;
}

/* =========================
   HELPERS (NORMALIZAÇÃO)
========================= */

const mapApiRecordToApp = (r: ApiFinancialRecord): FinancialRecord => {
  const isExpense = r.type === 'EXPENSE';

  let category: FinancialRecord['category'] = 'other';
  let categoryLabel = 'Outros';

  if (r.category === 'VENDAS_PRODUTOS') {
    category = 'product';
    categoryLabel = 'Venda Produto';
  } else if (r.category === 'REPOSICAO_ESTOQUE') {
    category = 'product';
    categoryLabel = 'Reposição Estoque';
  } else if (r.category === 'SERVICO' || r.description.toLowerCase().includes('corte')) {
    category = 'service';
    categoryLabel = 'Serviço';
  } else if (r.type === 'INCOME' && r.appointment) {
    category = 'appointment';
    categoryLabel = 'Agendamento';
  }

  let reference = r.professional?.name || '';
  
  if (r.clientName) reference = r.clientName;
  if (r.appointment?.client?.name) reference = r.appointment.client.name;

  return {
    id: r.id,
    description: r.description || 'Sem descrição',
    amount: r.amount,
    date: r.referenceDate,
    type: isExpense ? 'expense' : 'revenue',
    status: 'completed', 
    category: category,
    categoryLabel: categoryLabel,
    reference: reference,
  };
};

/* =========================
   SERVICE (MÉTODOS DA API)
========================= */

export const financeService = {
  
  /* ---------- DASHBOARD PRINCIPAL ---------- */
 getDashboard: async (params: { period: Period }): Promise<DashboardData> => {
    try {
        const response = await api.get('/financial/dashboard', { params });
        return response.data;
    } catch (error) {
        console.warn("Dashboard endpoint failed", error);
        // 👇 Agora o fallback tem os campos do CFO Digital zerados 👇
        return {
            revenue: 0, 
            expenses: 0, 
            balance: 0, 
            appointmentCount: 0, 
            averageTicket: 0,
            pendingExpenses: 0,
            safeBalance: 0,
            upcomingPayables: [],
            dailyEvolution: [], 
            topServices: [], 
            busyHours: []
        };
    }
  },

  /* ---------- NOVO: HISTÓRICO MENSAL (TABELA) ---------- */
  getMonthlyHistory: async (): Promise<MonthlyHistoryData[]> => {
    try {
      const response = await api.get('/financial/monthly-history');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar histórico mensal:", error);
      return [];
    }
  },

  /* 👇 ADICIONE ESTE NOVO MÉTODO 👇 */
  getWeeklyHistory: async (): Promise<MonthlyHistoryData[]> => {
    try {
      const response = await api.get('/financial/weekly-history');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar histórico semanal:", error);
      return [];
    }
  },

  /* ---------- REGISTROS / EXTRATO ---------- */
  getRecords: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<FinancialRecord[]> => {
    try {
      const response = await api.get<ApiFinancialRecord[]>('/financial', { params });

      if (!response.data || !Array.isArray(response.data)) {
          return [];
      }

      return response.data.map(mapApiRecordToApp);
    } catch (error) {
      console.error("Erro ao buscar extrato financeiro:", error);
      return []; 
    }
  },

  /* ---------- DELETE ---------- */
  deleteRecord: async (id: string): Promise<void> => {
    await api.delete(`/financial/${id}`);
  },

  /* ---------- RELATÓRIOS ---------- */
  getReports: async (params: {
    startDate: string;
    endDate: string;
    groupBy: 'day' | 'week' | 'month';
  }) => {
    const response = await api.get('/financial/reports', { params });
    return response.data;
  },

  /* ---------- CHARTS ---------- */
  getRevenueChart: async (
    params: { period: Period }
  ): Promise<RevenueData> => {
    try {
      const response = await api.get('/financial/revenue-chart', { params });
      return response.data;
    } catch {
      return { labels: [], values: [] };
    }
  },

  getExpensesChart: async (params: { period: Period }): Promise<ExpenseChartData[]> => {
    try {
      const response = await api.get('/financial/expenses-chart', { params });
      return response.data;
    } catch {
      return [];
    }
  },

  /* ---------- COMPARISON ---------- */
  getComparison: async (
    params: { period: Period }
  ): Promise<ComparisonData> => {
    try {
      const response = await api.get('/financial/comparison', { params });
      return response.data;
    } catch {
      return { previousPeriodRevenue: 0, growthPercentage: 0 };
    }
  },

};