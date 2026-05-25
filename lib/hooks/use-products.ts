import { useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { productService } from '@/lib/api/services/product.service';
import { handleApiError } from '@/lib/api/client';
import type {
  PaginationParams,
  CreateProductInput,
  UpdateProductInput,
  Product,
} from '@/lib/types';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated products
 */
export function useProducts(params?: PaginationParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await productService.getProducts(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch products');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await productService.getProductById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch product');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const response = await productService.createProduct(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create product');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      toast.success(`Product "${data.name}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateProductInput }) => {
      const response = await productService.updateProduct(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update product');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the cache for this specific product
      queryClient.setQueryData(productKeys.detail(variables.id), data);

      // Invalidate products list to refresh
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      toast.success(`Product "${data.name}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await productService.deleteProduct(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete product');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });

      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
