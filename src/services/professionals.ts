import { api } from "./api";

// Interface refletindo o objeto completo do Backend
export interface Professional {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  description?: string;
  photoUrl?: string;
  isActive: boolean;
  canBookOnline: boolean;
  commissionPercentage?: number;
  workHours?: any;
  services?: Array<{
    id: string;
    name: string;
  }>;
}

// Interface para criação/edição
export interface ProfessionalPayload {
  name: string;
  email?: string;
  description?: string;
  phone?: string;
  specialty?: string;
  photoUrl?: string;
  isActive?: boolean;
  canBookOnline?: boolean;
  commissionPercentage?: number;
  workHours?: any;
  password?: string; // Opcional para update
}

export const professionalService = {
  list: async (): Promise<Professional[]> => {
    const response = await api.get("/professionals");
    
    // 🛠️ FIX: Tratamento robusto de resposta
    // Se vier paginado (padrão Spring Boot 'Page')
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    
    // Se vier direto como array
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Fallback seguro
    return [];
  },

  get: async (id: string): Promise<Professional> => {
    const response = await api.get(`/professionals/${id}`);
    return response.data;
  },

  getAvailable: async (companyId: string) => {
    const response = await api.get("/public/professionals", {
      params: { companyId },
    });
    
    if (response.data && Array.isArray(response.data.content)) return response.data.content;
    return Array.isArray(response.data) ? response.data : [];
  },

  create: async (data: ProfessionalPayload) => {
    const response = await api.post("/professionals", data);
    return response.data;
  },

  update: async (id: string, data: Partial<ProfessionalPayload>) => {
    const response = await api.put(`/professionals/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/professionals/${id}`);
    return response.data;
  },

  getServices: async (professionalId: string) => {
    const response = await api.get(`/professionals/${professionalId}/services`);
    return response.data;
  },
};