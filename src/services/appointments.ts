import { api } from "./api";

/* =======================
   TYPES
======================= */

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  startTime: string; // Vem como string ISO do Java
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  actualPrice?: number;
  actualDuration?: number;
  notes?: string;

  // Suporte para o formato "Flat" ou "Objeto"
  clientName?: string;
  clientPhone?: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;

    paymentMethod?: string; // 👈 NOVO
  };

  professionalName?: string;
  professional?: {
    id: string;
    name: string;
  };

  appointmentServices?: Array<{
    service: {
      id: string;
      name: string;
      price: number;
      duration: number;
    };
    price: number;
  }>;
  // Caso venha no formato simplificado
  services?: any[];
}

export interface CreateAppointmentData {
  companyId: string;
  professionalId?: string; // Pode ser opcional
  serviceIds: string[];
  startTime: string; // String manual "2026-02-03T14:00:00"
  
  // Campos planos (Flat)
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  
  clientInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface AvailabilityParams {
  professionalId: string;
  date: string;
}

export interface AppointmentListParams {
  clientId?: string;
  professionalId?: string;
  date?: string; // YYYY-MM-DD
  status?: AppointmentStatus | AppointmentStatus[];
  limit?: number;
}

/* =======================
   SERVICE
======================= */

export const appointmentService = {
  list: async (params?: AppointmentListParams): Promise<Appointment[]> => {
    const response = await api.get("/appointments", { params });
    return response.data;
  },

  listByClient: async (clientId: string) => {
    try {
      const response = await api.get(`/appointments/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar histórico do cliente:", error);
      throw error;
    }
  },

  get: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentData) => {
    const response = await api.post("/appointments", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Appointment> | any) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    reason?: string,
    isPaid: boolean = true,
    paymentMethod?: string // 👈 NOVO PARÂMETRO
  ) => {
    // 👇 TROCAMOS DE api.patch PARA api.put
    const response = await api.put(`/appointments/${id}/status`, {
      status,
      reason,
      isPaid, 
      paymentMethod, // 👈 ENVIANDO PARA O JAVA
    });
    return response.data;
  },

  updateServices: async (id: string, serviceIds: string[]) => {
    const response = await api.put(`/appointments/${id}/services`, {
      serviceIds,
    });
    return response.data;
  },

  getAvailability: async (params: AvailabilityParams) => {
    const response = await api.get("/appointments/availability", { params });
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    return appointmentService.updateStatus(id, "CANCELLED", reason);
  },

  complete: async (id: string) => {
    return appointmentService.updateStatus(id, "COMPLETED");
  },
  
  getAvailableSlots: async (params: {
    serviceId: string;
    professionalId: string;
    date: string;
  }) => {
    const response = await api.get("/public/appointments/slots", { params });
    return response.data;
  },

  createPublic: async (data: any) => {
    const response = await api.post("/public/appointments", data);
    return response.data;
  },

  // 👇 Rota dedicada e mais rápida (O Java já faz o filtro e pega a empresa pelo token)
  getCompletedForReview: async () => {
    const response = await api.get('/appointments/completed-for-review');
    return response.data;
  },
};