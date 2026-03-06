import { api } from './api';

export interface Product {
  [x: string]: any;
  id: string;
  name: string;
  barcode?: string;
  type: 'RESALE' | 'CONSUMPTION';
  costPrice: number;
  salePrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  photoUrl?: string;
}

export interface CreateProductDTO {
  name: string;
  barcode?: string;
  type: 'RESALE' | 'CONSUMPTION';
  costPrice: number;
  salePrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  companyId: string;
  photoUrl?: string; // 👈 Adicionado para suportar o envio de foto
}

// 👇 DTO para a Venda
export interface SellProductDTO { // ou SellProductRequest
    quantity: number;
    clientName?: string;
    clientPhone?: string; // 👈 ADICIONE ESTA LINHA AQUI
    paymentMethod: string; // ou 'PIX' | 'CREDIT_CARD' | 'CASH'
}

export const productService = {
  // Lista produtos da empresa
  list: async (companyId: string): Promise<Product[]> => {
    const { data } = await api.get(`/products?companyId=${companyId}`);
    return data;
  },

  // Cria novo produto
  create: async (payload: CreateProductDTO): Promise<Product> => {
    const { data } = await api.post('/products', payload);
    return data;
  },

  // Atualiza produto existente
  update: async (id: string, payload: CreateProductDTO): Promise<Product> => {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  // Deleta produto
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // 👇 NOVA FUNÇÃO: REALIZAR VENDA
  sell: async (id: string, payload: SellProductDTO): Promise<void> => {
    await api.post(`/products/${id}/sell`, payload);
  }
};