import { api } from './api';

export const companyService = {
  
  // Buscar configurações (aceita ID opcional ou usa rota padrão)
  getSettings: async (companyId: string) => {
    // Se tiver ID, busca da rota específica, senão busca do contexto do token
    const url = companyId ? `/companies/${companyId}` : '/settings/company';
    const response = await api.get(url);
    return response.data;
  },

  // Atualizar configurações
  updateSettings: async (companyId: string, data: any) => {
    const url = companyId ? `/companies/${companyId}` : '/settings/company';
    const response = await api.put(url, data);
    return response.data;
  },

  // 👇 A CORREÇÃO DO ERRO DE UPLOAD ESTÁ AQUI
  uploadLogo: async (companyId: string, formData: FormData) => {
    // Usa o ID para montar a URL correta: /companies/{id}/logo
    const url = companyId ? `/companies/${companyId}/logo` : '/companies/logo';
    
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Isso impede que o Axios tente transformar o FormData em JSON antes de enviar
      transformRequest: (data, headers) => {
        return data; 
      },
    });

    return response.data;
  },
};