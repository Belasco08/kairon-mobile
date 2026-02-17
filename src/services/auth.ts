import { api } from './api';
import { UserRole } from '../contexts/AuthContext';

/* =======================
   CONFIG
======================= */

// Altere para false quando a API estiver 100% pronta
const USE_MOCK = false;

/* =======================
   TYPES
======================= */

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName: string;
  businessType: string;
}
// teste de conexao
export async function checkBackend() {
  const response = await api.get('/api/health');
  return response.data;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Usuário autenticado (perfil completo para app)
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;

  role: UserRole;
  companyId: string;
}


export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

/* =======================
   MOCK
======================= */

const mockAuthResponse = (
  email: string,
  name = 'Cauã'
): AuthResponse => ({
  user: {
    id: '1',
    name,
    email,
    phone: '(11) 99999-9999',
    role: 'OWNER',
    companyId: 'company-1',
  },
  token: 'fake-token',
  refreshToken: 'fake-refresh-token',
});


/* =======================
   SERVICE
======================= */

export const authService = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return mockAuthResponse(data.email, data.name);
    }

    const response = await api.post<AuthResponse>(
      '/auth/register',
      data
    );
    return response.data;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return mockAuthResponse(data.email);
    }

    const response = await api.post<AuthResponse>(
      '/auth/login',
      data
    );
    return response.data;
  },

  forgotPassword: async (
    data: ForgotPasswordData
  ): Promise<void> => {
    if (USE_MOCK) return;
    await api.post('/auth/forgot-password', data);
  },

  resetPassword: async (
    data: ResetPasswordData
  ): Promise<void> => {
    if (USE_MOCK) return;
    await api.post('/auth/reset-password', data);
  },

  getProfile: async (): Promise<AuthUser> => {
    if (USE_MOCK) {
      return mockAuthResponse('mock@email.com').user;
    }

    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    name: string;
    email: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<AuthUser> => {
    if (USE_MOCK) {
      return {
        ...mockAuthResponse(data.email, data.name).user,
        phone: data.phone,
      };
    }

    const response = await api.put<AuthUser>(
      '/users/me',
      data
    );
    return response.data;
  },

  uploadAvatar: async (formData: FormData): Promise<AuthUser> => {
  if (USE_MOCK) {
    return mockAuthResponse('mock@email.com').user;
  }

  const response = await api.post<AuthUser>(
    '/users/me/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
},


  refreshToken: async (
    refreshToken: string
  ): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return mockAuthResponse('mock@email.com');
    }

    const response = await api.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK) return;
    await api.post('/auth/logout');
  },
};
