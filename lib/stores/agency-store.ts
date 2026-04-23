import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agency } from '@/lib/types';

interface AgencyStore {
  selectedAgencyId: string | null;
  agencies: Agency[];

  setSelectedAgencyId: (id: string | null) => void;
  setAgencies: (agencies: Agency[]) => void;
  getSelectedAgency: () => Agency | null;
  clearAgencies: () => void;
}

export const useAgencyStore = create<AgencyStore>()(
  persist(
    (set, get) => ({
      selectedAgencyId: null,
      agencies: [],

      setSelectedAgencyId: (id) => set({ selectedAgencyId: id }),
      setAgencies: (agencies) => set({ agencies }),
      getSelectedAgency: () => {
        const { selectedAgencyId, agencies } = get();
        if (!selectedAgencyId) return null;
        return agencies.find((a) => a.id === selectedAgencyId) ?? null;
      },
      clearAgencies: () => set({ selectedAgencyId: null, agencies: [] }),
    }),
    {
      name: 'agency-storage',
      partialize: (state) => ({
        selectedAgencyId: state.selectedAgencyId,
      }),
    }
  )
);
