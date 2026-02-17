export * from './auth';
export {
  BusinessHours as CompanyBusinessHours,
  CompanySettings as CompanySettings,
} from './company';
export * from './appointments';
export * from './service';
export * from './professional';
export * from './client';
export * from '../services/finance';

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  from: string;
  to: string;
}

export interface FileUploadResponse {
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'NEW_CLIENT'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM_UPDATE'
  | 'PROMOTION';

export interface NotificationPreferences {
  emailNotifications: {
    newAppointments: boolean;
    cancellations: boolean;
    reminders: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  pushNotifications: {
    newAppointments: boolean;
    cancellations: boolean;
    reminders: boolean;
    updates: boolean;
  };
  smsNotifications: {
    reminders: boolean;
    confirmations: boolean;
  };
}