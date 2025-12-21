import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { useProductSearch, useDeleteProduct, useCreateProduct, useUpdateProduct, useProduct } from '../hooks/useProducts';
import { ProductResponse, ProductCreateRequest, ProductSearchItem } from '../types/api';
import { useCategories } from '../hooks/useCategories';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ProductForm } from '../components/products/ProductForm';

export const Products: React.FC = () => {
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Search filters
  const [filters, setFilters] = useState({
    categoryLabel: '',
    categoryIds: [] as number[],
    skus: [] as string[],
    isActive: undefined as boolean | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortField: 'NAME' as 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'VARIANT_COUNT',
    sortDirection: 'ASC' as 'ASC' | 'DESC',
    limit: 25,
    offset: 0,
  });

  // Build search request
  const searchRequest = React.useMemo(() => ({
    categoryLabel: filters.categoryLabel || undefined,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    skus: filters.skus.length > 0 ? filters.skus : undefined,
    isActive: filters.isActive,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    limit: filters.limit,
    offset: filters.offset,
    sort: {
      field: filters.sortField,
      direction: filters.sortDirection,
    },
  }), [filters]);

  const { data: searchData, isLoading } = useProductSearch(searchRequest);
  const { data: categories = [] } = useCategories();
  const { data: editingProduct, isLoading: isLoadingProduct } = useProduct(editingProductId || 0);
  const deleteProductMutation = useDeleteProduct();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const products = searchData?.items || [];
  const totalProducts = searchData?.total || 0;

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;

    try {
      await deleteProductMutation.mutateAsync(deletingProductId);
      setDeletingProductId(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      categoryLabel: '',
      categoryIds: [],
      skus: [],
      isActive: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortField: 'NAME',
      sortDirection: 'ASC',
      limit: 25,
      offset: 0,
    });
  };

  const hasActiveFilters = !!(filters.categoryLabel || filters.categoryIds.length > 0 || filters.skus.length > 0 || filters.isActive !== undefined || filters.minPrice || filters.maxPrice);

  const handleCreateProduct = async (data: ProductCreateRequest) => {
    console.log('Creating product with data:', data);
    setCreateError(null); // Clear previous errors
    
    try {
      const result = await createProductMutation.mutateAsync(data);
      console.log('Product created successfully:', result);
      setIsCreateModalOpen(false);
      setCreateError(null);
    } catch (error: any) {
      console.error('Failed to create product:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'An unexpected error occurred';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setCreateError(errorMessage);
    }
  };

  const handleUpdateProduct = async (data: ProductCreateRequest) => {
    if (!editingProductId || !editingProduct) return;
    
    console.log('Updating product with data:', data);
    setUpdateError(null); // Clear previous errors
    
    try {
      const result = await updateProductMutation.mutateAsync({
        productId: editingProductId,
        data
      });
      console.log('Product updated successfully:', result);
      setEditingProductId(null);
      setUpdateError(null);
    } catch (error: any) {
      console.error('Failed to update product:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'An unexpected error occurred';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setUpdateError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product catalog, variants, and pricing.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <ProductFilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalProducts={totalProducts}
        categories={categories}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 mt-6 bg-white shadow rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters ? 'No products match your search criteria.' : 'Get started by creating your first product.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product: ProductSearchItem) => (
                      <tr key={product.productId}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.skus.join(', ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>{product.categoryLabel}</div>
                          {product.categoryNames.length > 1 && (
                            <div className="text-xs text-gray-400 mt-1">
                              +{product.categoryNames.length - 1} more
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">₹{product.minPrice.toFixed(2)}</div>
                          {product.minPrice !== product.maxPrice && (
                            <div className="text-xs text-gray-500">to ₹{product.maxPrice.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isActive ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setUpdateError(null);
                                setEditingProductId(product.productId);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingProductId(product.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Create New Product"
        size="xl"
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }}
          isLoading={createProductMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProductId}
        onClose={() => {
          setEditingProductId(null);
          setUpdateError(null);
        }}
        title="Edit Product"
        size="xl"
      >
        {editingProductId && (
          <>
            {isLoadingProduct ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                <span className="ml-4 text-gray-600">Loading product details...</span>
              </div>
            ) : editingProduct ? (
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleUpdateProduct}
                onCancel={() => {
                  setEditingProductId(null);
                  setUpdateError(null);
                }}
                isLoading={updateProductMutation.isPending}
                error={updateError}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load product details. Please try again.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setEditingProductId(null);
                    setUpdateError(null);
                  }}
                >
                  Close
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this product? 
            This action cannot be undone and will also delete all associated variants.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeletingProductId(null)}
              disabled={deleteProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteProduct}
              isLoading={deleteProductMutation.isPending}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Product Filter Panel Component
interface ProductFilterPanelProps {
  filters: {
    categoryLabel: string;
    categoryIds: number[];
    skus: string[];
    isActive: boolean | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sortField: 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'VARIANT_COUNT';
    sortDirection: 'ASC' | 'DESC';
    limit: number;
    offset: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalProducts: number;
  categories: any[];
}

const ProductFilterPanel: React.FC<ProductFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  totalProducts,
  categories,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [skuInput, setSkuInput] = React.useState('');

  const handleSortChange = (field: typeof filters.sortField) => {
    const newDirection = filters.sortField === field && filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    onFilterChange({ ...filters, sortField: field, sortDirection: newDirection, offset: 0 });
  };

  const handleAddSku = () => {
    if (skuInput.trim() && !filters.skus.includes(skuInput.trim())) {
      onFilterChange({ ...filters, skus: [...filters.skus, skuInput.trim()], offset: 0 });
      setSkuInput('');
    }
  };

  const handleRemoveSku = (sku: string) => {
    onFilterChange({ ...filters, skus: filters.skus.filter(s => s !== sku), offset: 0 });
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    onFilterChange({ ...filters, categoryIds: newCategoryIds, offset: 0 });
  };

  return (
    <div className="mt-6 bg-white shadow rounded-lg">
      {/* Search Bar - Always Visible */}
      <div className="px-6 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by category label..."
            value={filters.categoryLabel}
            onChange={(e) => onFilterChange({ ...filters, categoryLabel: e.target.value, offset: 0 })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{totalProducts} products found</span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Categories Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                {categories.map((category) => (
                  <label key={category.categoryId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categoryIds.includes(category.categoryId)}
                      onChange={() => handleCategoryToggle(category.categoryId)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SKU Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by SKUs
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter SKU..."
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSku()}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <Button size="sm" onClick={handleAddSku}>
                  Add
                </Button>
              </div>
              {filters.skus.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.skus.map((sku) => (
                    <span
                      key={sku}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {sku}
                      <button
                        onClick={() => handleRemoveSku(sku)}
                        className="ml-1 inline-flex items-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined, offset: 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined, offset: 0 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => onFilterChange({ ...filters, isActive: e.target.value === '' ? undefined : e.target.value === 'true', offset: 0 })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSortChange('NAME')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'NAME'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    {filters.sortField === 'NAME' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('MIN_PRICE')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'MIN_PRICE'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Price</span>
                    {filters.sortField === 'MIN_PRICE' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('VARIANT_COUNT')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'VARIANT_COUNT'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Variants</span>
                    {filters.sortField === 'VARIANT_COUNT' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Current: {filters.sortField.replace('_', ' ')} ({filters.sortDirection})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
