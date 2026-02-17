import { User, Company } from './auth';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
  onlineBooking: boolean;
  
  // Relationships
  companyId: string;
  company: Company;
  
  professionalId?: string;
  professional?: User;
  
  // Statistics
  totalAppointments?: number;
  totalRevenue?: number;
  averageRating?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  servicesCount: number;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
  onlineBooking: boolean;
  professionalId?: string;
  companyId: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
  isActive?: boolean;
  onlineBooking?: boolean;
  professionalId?: string;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  onlineBookingServices: number;
  totalRevenue: number;
  averagePrice: number;
  averageDuration: number;
}

export interface ServiceFilter {
  category?: string;
  isActive?: boolean;
  onlineBooking?: boolean;
  professionalId?: string;
  companyId?: string;
  search?: string;
}

export interface ServicePublic {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  onlineBooking: boolean;
  companyId: string;
  professionalId?: string;
  professionalName?: string;
}