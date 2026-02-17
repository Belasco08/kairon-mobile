import { SocialMedia, UserRole } from './auth';

/* =======================
   COMPANY MODELS
   ======================= */

export interface CompanyPublic {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  businessHours?: WeeklyBusinessHours;
  socialMedia?: SocialMedia;
}

export interface CompanyStats {
  totalAppointments: number;
  totalRevenue: number;
  totalClients: number;
  totalServices: number;
  totalProfessionals: number;
  averageRating: number;
  growthPercentage: number;
}

/* =======================
   BUSINESS HOURS
   ======================= */

// Horário por dia
export interface BusinessHours {
  open: string;
  close: string;
}

// Horário da semana inteira
export type WeeklyBusinessHours = {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
};

/* =======================
   COMPANY SETTINGS
   ======================= */

// ⚠️ Settings COMPLETO (API)
export interface CompanySettings {
  onlineBooking: boolean;
  requireConfirmation: boolean;
  allowCancellations: boolean;
  cancellationNoticeHours: number;
  sendReminders: boolean;
  reminderHours: number;
  timezone: string;
  currency: string;
  language: string;
}

// ✅ Settings para UPDATE
export interface CompanySettingsUpdate {
  onlineBooking: boolean;
  requireConfirmation: boolean;
  allowCancellations: boolean;
  cancellationNoticeHours: number;
  sendReminders: boolean;
  reminderHours: number;
}

/* =======================
   REQUESTS
   ======================= */

export interface CompanyUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  description?: string;
  businessHours?: WeeklyBusinessHours;
  settings?: CompanySettingsUpdate;
}

/* =======================
   BILLING
   ======================= */

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE';

export interface SubscriptionFeatures {
  maxProfessionals: number;
  maxServices: number;
  maxAppointments: number;
  onlineBooking: boolean;
  customDomain: boolean;
  analytics: boolean;
  support: 'BASIC' | 'PRIORITY' | 'DEDICATED';
}

export interface Invoice {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PAID'
  | 'VOID'
  | 'UNCOLLECTIBLE';
