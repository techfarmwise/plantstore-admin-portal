import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/products';
import { ProductCreateRequest, ProductResponse, ProductSearchRequest } from '../types/api';

export const PRODUCTS_QUERY_KEY = 'products';
export const PRODUCTS_SEARCH_QUERY_KEY = 'productsSearch';

export const useProducts = () => {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: async () => {
      const products = await productService.getProducts();
      console.log('Products API response:', products);
      return products;
    },
  });
};

export const useProduct = (productId: number) => {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, productId],
    queryFn: () => productService.getProduct(productId),
    enabled: !!productId,
  });
};

export const useProductSearch = (request: ProductSearchRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: [PRODUCTS_SEARCH_QUERY_KEY, request],
    queryFn: () => productService.searchProducts(request),
    enabled,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCreateRequest) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_SEARCH_QUERY_KEY] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: Partial<ProductCreateRequest> }) =>
      productService.updateProduct(productId, data),
    onSuccess: (_: any, { productId }: { productId: number }) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_SEARCH_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, productId] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => productService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_SEARCH_QUERY_KEY] });
    },
  });
};
