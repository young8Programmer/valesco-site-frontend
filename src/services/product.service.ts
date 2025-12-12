import { createApiClient } from '../utils/api';
import type { SiteType, Product } from '../types';

export const productService = {
  async getAll(site: SiteType, token: string, filters?: { categoryId?: number; brandId?: number }) {
    const client = createApiClient(site, token);
    const params = new URLSearchParams();
    // GPG uses brandId, Valesco uses categoryId
    if (site === 'gpg' && filters?.brandId) {
      params.append('brandId', filters.brandId.toString());
    } else if (site === 'valesco' && filters?.categoryId) {
      params.append('categoryId', filters.categoryId.toString());
    }
    
    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await client.get(url);
    return response.data;
  },

  async getOne(site: SiteType, token: string, id: number): Promise<Product> {
    const client = createApiClient(site, token);
    const response = await client.get(`/products/${id}`);
    return response.data;
  },

  async create(site: SiteType, token: string, data: FormData): Promise<Product> {
    const client = createApiClient(site, token);
    const response = await client.post('/products', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(site: SiteType, token: string, id: number, data: FormData): Promise<Product> {
    const client = createApiClient(site, token);
    const response = await client.patch(`/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(site: SiteType, token: string, id: number): Promise<void> {
    const client = createApiClient(site, token);
    await client.delete(`/products/${id}`);
  },
};




