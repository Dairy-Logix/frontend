import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export type AgencyFormulaToken =
  | { type: 'agency'; agencyId: string; agencyName: string }
  | { type: 'operator'; value: '+' };

export interface AgencyFormula {
  tokens: AgencyFormulaToken[];
  updatedAt?: string;
}

export interface PreviewAgency {
  id: string;
  name: string;
  operator: '+';
}

export interface PreviewRow {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  total: number;
  savedQuantities: Record<string, number>;
}

export interface AgencyFormulaPreview {
  formula: AgencyFormula;
  agencies: PreviewAgency[];
  rows: PreviewRow[];
  computedAt: string;
  dateRange: { start: string; end: string };
  timezone: string;
}

export interface FormulaQuantityEntry {
  productId: string;
  agencyId: string;
  quantity: number;
}

export const planningStudioService = {
  async getFormula(): Promise<ApiResponse<AgencyFormula | null>> {
    const { data } = await apiClient.get<AgencyFormula | null>(
      '/settings/agency-formula'
    );
    return {
      success: true,
      data,
      message: 'Formula fetched',
    };
  },

  async saveFormula(
    tokens: AgencyFormulaToken[]
  ): Promise<ApiResponse<AgencyFormula>> {
    const { data } = await apiClient.put<AgencyFormula>(
      '/settings/agency-formula',
      { tokens }
    );
    return {
      success: true,
      data,
      message: 'Formula saved',
    };
  },

  async getFormulaPreview(): Promise<ApiResponse<AgencyFormulaPreview>> {
    const { data } = await apiClient.get<AgencyFormulaPreview>(
      '/planning-studio/agency-formula/preview'
    );
    return {
      success: true,
      data,
      message: 'Preview fetched',
    };
  },

  async saveFormulaQuantities(
    quantities: FormulaQuantityEntry[]
  ): Promise<ApiResponse<{ saved: number }>> {
    const { data } = await apiClient.put<{ saved: number }>(
      '/planning-studio/agency-formula/quantities',
      { quantities }
    );
    return {
      success: true,
      data,
      message: 'Quantities saved',
    };
  },
};
