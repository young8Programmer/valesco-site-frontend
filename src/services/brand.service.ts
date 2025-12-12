import { createApiClient } from '../utils/api';
import type { SiteType, Brand } from '../types';

export const brandService = {
  async getAll(site: SiteType, token: string, categoryId?: number): Promise<Brand[]> {
    if (site !== 'gpg') return []; // Only GPG has brands
    const client = createApiClient(site, token);
    const url = categoryId ? `/brands?categoryId=${categoryId}` : '/brands';
    const response = await client.get(url);
    return response.data;
  },

  async getOne(site: SiteType, token: string, id: number): Promise<Brand> {
    if (site !== 'gpg') throw new Error('Brands only available for GPG');
    const client = createApiClient(site, token);
    const response = await client.get(`/brands/${id}`);
    return response.data;
  },

  async create(site: SiteType, token: string, data: FormData): Promise<Brand> {
    if (site !== 'gpg') throw new Error('Brands only available for GPG');
    const client = createApiClient(site, token);
    const response = await client.post('/brands', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(site: SiteType, token: string, id: number, data: FormData): Promise<Brand> {
    if (site !== 'gpg') throw new Error('Brands only available for GPG');
    const client = createApiClient(site, token);
    const response = await client.patch(`/brands/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(site: SiteType, token: string, id: number): Promise<void> {
    if (site !== 'gpg') throw new Error('Brands only available for GPG');
    const client = createApiClient(site, token);
    await client.delete(`/brands/${id}`);
  },
};




