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

  // 👇 BUSCA A LISTA DE CLIENTES SUMIDOS (MOTOR DE RETENÇÃO) CORRIGIDA
  getMissingClients: async (days: number = 30) => {
    // Apontando para a rota correta que está no ClientController.java
    const response = await api.get('/clients/missing', { 
        params: { daysAway: days } 
    });
    
    // Tratamento de paginação do Spring Boot (o Java devolve um Page<MissingClientResponse>)
    if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
    }
    
    return response.data;
  },

  // Adicione isso junto com as outras funções (create, update, get...)
  redeemFidelity: async (clientId: string) => {
    const response = await api.post(`/clients/${clientId}/fidelity/redeem`);
    return response.data;
  },
};