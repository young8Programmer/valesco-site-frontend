import { createApiClient } from '../utils/api';
import type { SiteType, Brand } from '../types';

export const brandService = {
  async getAll(site: SiteType, token: string): Promise<Brand[]> {
    if (site !== 'gpg') return []; // Only GPG has brands
    const client = createApiClient(site, token);
    const response = await client.get('/brands');
    return response.data;
  },
};


