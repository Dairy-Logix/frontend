import { apiClient } from '@/lib/api/client';

export interface MyStoreProductInfo {
  productId: string;
  name: string;
  shortName?: string;
  code: string;
  category: 'Crate' | 'Piece';
  /** Pieces in one crate. 1 for Piece products. */
  piecesPerCrate: number;
  photoUrl: string | null;
  /** Distributor price (per crate for Crate, per piece for Piece) — reference only. */
  distributorPrice: number;
  mrp?: number;
}

export interface MyStoreItem extends MyStoreProductInfo {
  piecePrice: number;
  /** Only ever set for Crate products. */
  cratePrice: number | null;
  sortOrder: number;
}

export interface MyStoreConfigProduct extends MyStoreProductInfo {
  selected: boolean;
  piecePrice: number | null;
  cratePrice: number | null;
  sortOrder: number | null;
}

export interface SaveMyStoreItemInput {
  productId: string;
  piecePrice: number;
  cratePrice?: number;
}

export const myStoreService = {
  async getItems(): Promise<MyStoreItem[]> {
    const { data } = await apiClient.get<{ items: MyStoreItem[] }>('/my-store/items');
    return data.items ?? [];
  },
  async getConfig(): Promise<MyStoreConfigProduct[]> {
    const { data } = await apiClient.get<{ products: MyStoreConfigProduct[] }>('/my-store/config');
    return data.products ?? [];
  },
  async saveItems(items: SaveMyStoreItemInput[]): Promise<MyStoreItem[]> {
    const { data } = await apiClient.put<{ items: MyStoreItem[] }>('/my-store/items', { items });
    return data.items ?? [];
  },
};
