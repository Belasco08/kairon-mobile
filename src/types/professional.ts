import { User, Company } from './auth';
import { Service, ServicePublic } from './service';

export interface Professional extends User {
  specialty?: string;
  commissionPercentage?: number;
  canBookOnline: boolean;
  isActive: boolean;

  // Statistics
  totalAppointments?: number;
  completedAppointments?: number;
  totalRevenue?: number;
  commissionAmount?: number;
  averageRating?: number;
  averageDuration?: number;

  // Relationships
  services?: Service[];
  company: Company;
}

export interface ProfessionalAvailability {
  professionalId: string;
  date: string;
  available: boolean;
  reason?: string;
  timeSlots: ProfessionalTimeSlot[];
}

export interface ProfessionalTimeSlot {
  time: string;
  available: boolean;
}

export interface WorkingHours {
  professionalId: string;
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

export interface CreateProfessionalRequest {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  password: string;
  commissionPercentage?: number;
  canBookOnline: boolean;
  isActive: boolean;
  companyId: string;
}

export interface UpdateProfessionalRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  commissionPercentage?: number;
  canBookOnline?: boolean;
  isActive?: boolean;
  password?: string;
}

export interface ProfessionalStats {
  totalProfessionals: number;
  activeProfessionals: number;
  totalAppointments: number;
  totalRevenue: number;
  totalCommission: number;
  averageRating: number;
}

export interface ProfessionalFilter {
  isActive?: boolean;
  canBookOnline?: boolean;
  specialty?: string;
  companyId?: string;
  search?: string;
}

export interface ProfessionalPublic {
  id: string;
  name: string;
  specialty?: string;
  avatar?: string;
  canBookOnline: boolean;
  companyId: string;
  services?: ServicePublic[];
}
