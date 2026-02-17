import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';

import { useAuth } from './AuthContext';
import { companyService } from '../services/company';

/* =======================
   TYPES
======================= */

interface Company {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  currency: string;
  logoUrl?: string;
  workHours: any;
  slotDuration: number;
  bufferTime: number;
}

interface CompanyContextData {
  company: Company | null;
  loading: boolean;
  updateCompany: (data: Partial<Company>) => void;
  refreshCompany: () => Promise<void>;
}

/* =======================
   CONTEXT
======================= */

export const CompanyContext = createContext<CompanyContextData>(
  {} as CompanyContextData
);

export const useCompany = () => useContext(CompanyContext);

/* =======================
   PROVIDER
======================= */

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  /* =======================
     LOAD COMPANY (JWT)
  ======================= */

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await companyService.getSettings();
      setCompany(data);
    } catch (error) {
      console.error('Erro ao carregar company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     EFFECT — AUTH CHANGES
  ======================= */

  useEffect(() => {
    // Não logado
    if (!isAuthenticated || !user) {
      setCompany(null);
      setLoading(false);
      return;
    }

    // CLIENT não possui empresa
    if (user.role === 'CLIENT') {
      setCompany(null);
      setLoading(false);
      return;
    }

    // OWNER / STAFF → carrega empresa via JWT
    loadCompany();
  }, [isAuthenticated, user?.id]);

  /* =======================
     UPDATE (LOCAL ONLY)
  ======================= */

  const updateCompany = (data: Partial<Company>) => {
    setCompany(prev =>
      prev ? { ...prev, ...data } : prev
    );
  };

  /* =======================
     REFRESH
  ======================= */

  const refreshCompany = async () => {
    if (!isAuthenticated) return;
    await loadCompany();
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        loading,
        updateCompany,
        refreshCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
