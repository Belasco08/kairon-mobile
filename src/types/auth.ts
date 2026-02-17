export type UserRole = 'OWNER' | 'ADMIN' | 'PROFESSIONAL' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Company relationship
  companyId?: string;
  company?: Company;
  
  // Professional specific fields
  specialty?: string;
  commissionPercentage?: number;
  canBookOnline?: boolean;
  
  // Client specific fields
  birthDate?: string;
  address?: string;
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Settings
  settings?: CompanySettings;
  businessHours?: BusinessHours;
  socialMedia?: SocialMedia;
}

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

export interface BusinessHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone: string;
  companyName?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface VerifyEmailRequest {
  token: string;
}