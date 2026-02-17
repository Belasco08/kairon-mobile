import { api } from "./api";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  color?: string;
  isActive: boolean;
  onlineBooking: boolean;
  professionalId?: string;
}

export interface ServicePublic {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  color?: string;
  isActive: boolean;
  onlineBooking: boolean;
  professionalId?: string;
}

export const serviceService = {
  list: async (professionalId?: string) => {
    const params = professionalId ? { professionalId } : {};
    const response = await api.get("/services", { params });
    
    // 🔍 DEBUG TECH LEAD: Verificando o formato exato
    // console.log("📦 Raw API Response:", response.data);

    // CASO 1: O Backend retorna nosso DTO customizado (ServiceListResponse)
    if (response.data && Array.isArray(response.data.services)) {
      return response.data.services; 
    }

    // CASO 2: O Backend retorna paginação padrão do Spring (Page<T>)
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    
    // CASO 3: O Backend retorna a lista direta (Array puro)
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Fallback: Retorna array vazio para não quebrar o .map na tela
    return [];
  },

  get: async (id: string) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  getPublic: async (companyId: string) => {
    const response = await api.get("/public/services", {
      params: { companyId },
    });
    
    // 🛠️ FIX TECH LEAD: Aplicando a mesma proteção na rota pública
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }

    return response.data;
  },

  create: async (data: CreateServiceData) => {
    const response = await api.post("/services", data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateServiceData>) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  assignToProfessional: async (serviceId: string, professionalId: string) => {
    const response = await api.put(`/services/${serviceId}/assign`, {
      professionalId,
    });
    return response.data;
  },
};