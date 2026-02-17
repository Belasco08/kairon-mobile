import { api } from './api';
import { Company } from '../contexts/AuthContext';

export const getCompanySettings = async (): Promise<Company> => {
  const response = await api.get('/settings/company');
  return response.data;
};
