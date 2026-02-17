import { User, Company } from './auth';
import { Appointment } from './appointments';

export interface Client extends User {
  birthDate?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  
  // Statistics
  totalAppointments: number;
  totalSpent: number;
  averageRating?: number;
  lastAppointment?: string;
  
  // Relationships
  company: Company;
  appointments?: Appointment[];
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalRevenue: number;
  averageSpent: number;
  averageAppointments: number;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  companyId: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface ClientFilter {
  isActive?: boolean;
  companyId?: string;
  search?: string;
  hasAppointments?: boolean;
}

export interface ClientPublic {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  companyId: string;
}