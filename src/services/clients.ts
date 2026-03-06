import { api } from './api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
  totalAppointments: number;
  totalSpent: number;
  lastAppointment?: string;
}

export const clientService = {
  // Agora aceita professionalId nos parâmetros
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    professionalId?: string; // 👈 Adicionado
  }) => {
    
    // O axios converte o objeto params automaticamente para ?professionalId=123 na URL
    const response = await api.get('/clients', { params });
    
    // 🛠️ TRATAMENTO PARA PAGINAÇÃO DO SPRING BOOT
    // Se vier paginado (com 'content'), retorna o array interno.
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    
    // Fallback: se não tiver paginação, retorna o data direto
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Client>) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  getAppointments: async (clientId: string) => {
    const response = await api.get(`/clients/${clientId}/appointments`);
    
    // Aplicamos a mesma lógica aqui, pois appointments também pode ser paginado
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    return response.data;
  },
  // Adicione junto com os outros métodos de clientService
  // 👇 BUSCA A LISTA DE CLIENTES SUMIDOS (MOTOR DE RETENÇÃO)
  getMissingClients: async (days: number = 30) => {
    // Estamos chamando a rota do RetentionController que criamos no Spring Boot
    const response = await api.get('/retention/recover');
    
    // O backend já vai devolver a lista formatada com quem não vem há mais de 25/30 dias
    return response.data;
  },

  // Adicione isso junto com as outras funções (create, update, get...)
  redeemFidelity: async (clientId: string) => {
    const response = await api.post(`/clients/${clientId}/fidelity/redeem`);
    return response.data;
  },
};