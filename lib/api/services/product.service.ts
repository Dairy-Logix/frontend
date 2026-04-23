import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@/lib/types';

// Transform frontend input to backend DTO field names
function toBackendDto(input: Partial<CreateProductInput & UpdateProductInput>): Record<string, any> {
  const dto: Record<string, any> = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.productCode !== undefined) dto.code = input.productCode;
  if (input.shortName !== undefined) dto.shortName = input.shortName;
  if (input.category !== undefined) dto.category = input.category;
  if (input.description !== undefined) dto.description = input.description;
  if (input.quantityPerUnit !== undefined) dto.quantity = input.quantityPerUnit;
  if (input.purchasePricePerUnit !== undefined) dto.price = input.purchasePricePerUnit;
  if (input.sellingPricePerUnit !== undefined) dto.mrp = input.sellingPricePerUnit;
  if ((input as UpdateProductInput).isActive !== undefined)
    dto.status = (input as UpdateProductInput).isActive ? 'active' : 'inactive';
  return dto;
}

// Transform backend product to frontend Product type
function mapProduct(raw: any): Product {
  return {
    id: raw._id || raw.id,
    productCode: raw.code || raw.productCode || '',
    name: raw.name || '',
    shortName: raw.shortName || raw.name || '',
    category: raw.category || 'Crate',
    quantityPerUnit: raw.quantityPerUnit ?? raw.quantity ?? 1,
    purchasePricePerUnit: raw.purchasePricePerUnit ?? raw.price ?? 0,
    sellingPricePerUnit: raw.sellingPricePerUnit ?? raw.mrp ?? raw.price ?? 0,
    isActive: raw.isActive ?? (raw.status === 'active'),
    tenantId: raw.tenantId || '',
    description: raw.description,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const productService = {
  async getProducts(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const mapped = params ? { ...params, limit: params.pageSize, pageSize: undefined } : undefined;
    const { data } = await apiClient.get<{ products: any[]; pagination: any }>(
      '/products',
      { params: mapped }
    );
    const pag = data.pagination || {};
    return {
      success: true,
      data: {
        data: (data.products || []).map(mapProduct),
        total: pag.total ?? 0,
        page: pag.page ?? 1,
        pageSize: pag.pageSize ?? pag.limit ?? 20,
        totalPages: pag.totalPages ?? 1,
      },
      message: 'Products fetched successfully',
    };
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const { data } = await apiClient.get<any>(`/products/${id}`);
    return {
      success: true,
      data: mapProduct(data),
      message: 'Product fetched successfully',
    };
  },

  async createProduct(input: CreateProductInput): Promise<ApiResponse<Product>> {
    const { data } = await apiClient.post<any>('/products', toBackendDto(input));
    return {
      success: true,
      data: mapProduct(data),
      message: 'Product created successfully',
    };
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<ApiResponse<Product>> {
    const { data } = await apiClient.patch<any>(`/products/${id}`, toBackendDto(input));
    return {
      success: true,
      data: mapProduct(data),
      message: 'Product updated successfully',
    };
  },

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/products/${id}`);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  },
};
