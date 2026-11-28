import { apiClient } from '@/lib/api/client';
import type { CrossingResult } from '@/lib/types';

export const crossingService = {
  /** What each truck hands over / receives for one business day (YYYY-MM-DD). */
  async getCrossing(date: string): Promise<CrossingResult> {
    const { data } = await apiClient.get<CrossingResult>('/crossing', { params: { date } });
    return data;
  },
};
