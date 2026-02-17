import { api } from './api';

/* =========================
   TIPOS BASE
========================= */

export type Period = 'day' | 'week' | 'month' | 'year';

/* =========================
   DASHBOARD
========================= */

export interface DashboardData {
  revenue: number;
  expenses: number; // backend pode mandar 'expenses' ou 'totalExpenses'
  balance: number;  // backend pode mandar 'balance' ou 'netProfit'
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
  type: 'INCOME' | 'EXPENSE'; // O Java manda assim
  category: string;           // Ex: VENDAS_PRODUTOS, REPOSICAO_ESTOQUE, SERVICO
  amount: number;
  description: string;
  referenceDate: string;
  status: string;
  paymentMethod: string;
  
  // Opcionais dependendo da origem
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
  category: 'appointment' | 'product' | 'service' | 'other'; // Usado para ícones
  categoryLabel: string; // Texto bonito para exibir
  status: 'pending' | 'completed' | 'cancelled';
  reference?: string; // Nome do Cliente ou Profissional
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

  // 1. Define a Categoria Visual (Ícones)
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

  // 2. Define a Referência (Quem?)
  let reference = r.professional?.name || '';
  
  // Se tiver cliente (via agendamento ou direto), prioriza mostrar o cliente
  if (r.clientName) reference = r.clientName;
  if (r.appointment?.client?.name) reference = r.appointment.client.name;

  return {
    id: r.id,
    description: r.description || 'Sem descrição',
    amount: r.amount,
    date: r.referenceDate,
    type: isExpense ? 'expense' : 'revenue',
    status: 'completed', // Assumimos concluído pois já está no financeiro
    category: category,
    categoryLabel: categoryLabel,
    reference: reference,
  };
};

/* =========================
   SERVICE
========================= */

export const financeService = {
  /* ---------- DASHBOARD ---------- */
  getDashboard: async (params: { period: Period }): Promise<DashboardData> => {
    // Tenta pegar os dados agregados. Se o backend ainda não tiver essa rota exata, 
    // pode dar 404, mas focamos nos RECORDS agora.
    try {
        const response = await api.get('/financial/dashboard', { params });
        return response.data;
    } catch (error) {
        console.warn("Dashboard endpoint failed, returning empty structure", error);
        return {
            revenue: 0, expenses: 0, balance: 0, appointmentCount: 0, averageTicket: 0,
            dailyEvolution: [], topServices: [], busyHours: []
        };
    }
  },

  /* ---------- REGISTROS (AQUI ESTÁ A MUDANÇA) ---------- */
  getRecords: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<FinancialRecord[]> => {
    try {
      // ⚠️ Chama o novo endpoint que lista TUDO (Vendas + Serviços)
      const response = await api.get<ApiFinancialRecord[]>('/financial', { params });

      if (!response.data || !Array.isArray(response.data)) {
          return [];
      }

      return response.data.map(mapApiRecordToApp);
    } catch (error) {
      console.error("Erro ao buscar extrato financeiro:", error);
      // Retorna vazio em vez de Mock para você saber se deu erro real
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

  /* ---------- CHART ---------- */
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

  getExpensesChart: async (params: { period: Period }): Promise<ExpenseChartData[]> => {
    try {
      const response = await api.get('/financial/expenses-chart', { params });
      return response.data;
    } catch {
      return [];
    }
},
};