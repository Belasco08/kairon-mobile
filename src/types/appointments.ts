import { User } from './auth';
import { Company } from '../contexts/AuthContext';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'transfer';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;

  // Relationships
  serviceId: string;
  service: AppointmentService;

  professionalId: string;
  professional: User;

  clientId?: string;
  client?: User;

  companyId: string;
  company: Company;

  // Payment
  price: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;

  // Metadata
  notes?: string;
  cancellationReason?: string;
  rating?: number;
  review?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AppointmentService {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
  onlineBooking: boolean;
  companyId: string;
  professionalId?: string;

  // Relationships
  company: Company;
  professional?: User;

  createdAt: string;
  updatedAt: string;
}

export interface AppointmentTimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}

export interface CreateAppointmentRequest {
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  time?: string;
  duration?: number;
  status?: AppointmentStatus;
  professionalId?: string;
  serviceId?: string;
  notes?: string;
  cancellationReason?: string;
}

export interface AppointmentFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  professionalId?: string;
  serviceId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  companyId?: string;
  limit?: number;
  offset?: number;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
  averageRating: number;
}

export interface DailyAppointment {
  date: string;
  count: number;
  revenue: number;
}

export interface ProfessionalAppointmentStats {
  professionalId: string;
  professionalName: string;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
  averageRating: number;
}

export interface AppointmentReminder {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  reminderType: 'email' | 'sms' | 'both';
}
