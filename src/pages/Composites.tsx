import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { useCompositeSearch, useDeleteComposite, useCreateComposite, useUpdateComposite, useComposite } from '../hooks/useComposites';
import { CompositeSearchItem, CompositeCreateRequest } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CompositeForm } from '../components/composites/CompositeForm';

export const Composites: React.FC = () => {
  const [deletingCompositeId, setDeletingCompositeId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompositeId, setEditingCompositeId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Search filters
  const [filters, setFilters] = useState({
    name: '',
    pricingMode: undefined as 'FIXED' | 'DYNAMIC' | undefined,
    isActive: undefined as boolean | undefined,
    variantSkuQuery: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortField: 'NAME' as 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'ITEM_COUNT',
    sortDirection: 'ASC' as 'ASC' | 'DESC',
    limit: 25,
    offset: 0,
  });

  // Build search request
  const searchRequest = React.useMemo(() => ({
    name: filters.name || undefined,
    pricingMode: filters.pricingMode,
    isActive: filters.isActive,
    variantSkuQuery: filters.variantSkuQuery || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    limit: filters.limit,
    offset: filters.offset,
    sort: {
      field: filters.sortField,
      direction: filters.sortDirection,
    },
  }), [filters]);

  const { data: searchData, isLoading } = useCompositeSearch(searchRequest);
  const { data: editingComposite, isLoading: isLoadingComposite } = useComposite(editingCompositeId);
  const deleteCompositeMutation = useDeleteComposite();
  const createCompositeMutation = useCreateComposite();
  const updateCompositeMutation = useUpdateComposite();

  const composites = searchData?.items || [];
  const totalComposites = searchData?.total || 0;

  const handleDeleteComposite = async () => {
    if (!deletingCompositeId) return;

    try {
      await deleteCompositeMutation.mutateAsync(deletingCompositeId);
      setDeletingCompositeId(null);
    } catch (error) {
      console.error('Failed to delete composite:', error);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      pricingMode: undefined,
      isActive: undefined,
      variantSkuQuery: '',
      minPrice: undefined,
      maxPrice: undefined,
      sortField: 'NAME',
      sortDirection: 'ASC',
      limit: 25,
      offset: 0,
    });
  };

  const hasActiveFilters = !!(filters.name || filters.pricingMode || filters.isActive !== undefined || filters.variantSkuQuery || filters.minPrice || filters.maxPrice);

  const handleCreateComposite = async (data: CompositeCreateRequest) => {
    console.log('Creating composite with data:', data);
    setCreateError(null);
    
    try {
      const result = await createCompositeMutation.mutateAsync(data);
      console.log('Composite created successfully:', result);
      setIsCreateModalOpen(false);
      setCreateError(null);
    } catch (error: any) {
      console.error('Failed to create composite:', error);
      
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

  const handleUpdateComposite = async (data: CompositeCreateRequest) => {
    if (!editingCompositeId || !editingComposite) return;
    
    console.log('Updating composite with data:', data);
    setUpdateError(null);
    
    try {
      const result = await updateCompositeMutation.mutateAsync({
        compositeId: editingCompositeId,
        data
      });
      console.log('Composite updated successfully:', result);
      setEditingCompositeId(null);
      setUpdateError(null);
    } catch (error: any) {
      console.error('Failed to update composite:', error);
      
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

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Composite Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage product bundles and composite offerings.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Composite
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <CompositeFilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalComposites={totalComposites}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      ) : composites.length === 0 ? (
        <div className="text-center py-12 mt-6 bg-white shadow rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No composites</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters ? 'No composites match your search criteria.' : 'Get started by creating your first composite product.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Composite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
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
              {composites.map((composite: CompositeSearchItem) => (
                <tr key={composite.compositeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {composite.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {composite.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      composite.pricingMode.toLowerCase() === 'fixed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {composite.pricingMode.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {composite.pricingMode.toLowerCase() === 'fixed' && composite.fixedPrice ? (
                      <div className="font-medium">₹{composite.fixedPrice.toFixed(2)}</div>
                    ) : (
                      <>
                        <div className="font-medium">₹{composite.minPrice.toFixed(2)}</div>
                        {composite.minPrice !== composite.maxPrice && (
                          <div className="text-xs text-gray-500">to ₹{composite.maxPrice.toFixed(2)}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{composite.itemCount} item{composite.itemCount !== 1 ? 's' : ''}</div>
                    {composite.variants.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {composite.variants.slice(0, 2).map(v => v.sku).join(', ')}
                        {composite.variants.length > 2 && ` +${composite.variants.length - 2}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      composite.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {composite.isActive ? (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setUpdateError(null);
                          setEditingCompositeId(composite.compositeId);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingCompositeId(composite.compositeId)}
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

      {/* Create Composite Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Create New Composite"
        size="xl"
      >
        <CompositeForm
          onSubmit={handleCreateComposite}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }}
          isLoading={createCompositeMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Composite Modal */}
      <Modal
        isOpen={!!editingCompositeId}
        onClose={() => {
          setEditingCompositeId(null);
          setUpdateError(null);
        }}
        title="Edit Composite"
        size="xl"
      >
        {editingCompositeId && (
          <>
            {isLoadingComposite ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                <span className="ml-4 text-gray-600">Loading composite details...</span>
              </div>
            ) : editingComposite ? (
              <CompositeForm
                initialData={editingComposite}
                onSubmit={handleUpdateComposite}
                onCancel={() => {
                  setEditingCompositeId(null);
                  setUpdateError(null);
                }}
                isLoading={updateCompositeMutation.isPending}
                error={updateError}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load composite details. Please try again.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setEditingCompositeId(null);
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
        isOpen={!!deletingCompositeId}
        onClose={() => setDeletingCompositeId(null)}
        title="Delete Composite"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this composite product? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeletingCompositeId(null)}
              disabled={deleteCompositeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteComposite}
              isLoading={deleteCompositeMutation.isPending}
            >
              Delete Composite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Composite Filter Panel Component
interface CompositeFilterPanelProps {
  filters: {
    name: string;
    pricingMode: 'FIXED' | 'DYNAMIC' | undefined;
    isActive: boolean | undefined;
    variantSkuQuery: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sortField: 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'ITEM_COUNT';
    sortDirection: 'ASC' | 'DESC';
    limit: number;
    offset: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalComposites: number;
}

const CompositeFilterPanel: React.FC<CompositeFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  totalComposites,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSortChange = (field: typeof filters.sortField) => {
    const newDirection = filters.sortField === field && filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    onFilterChange({ ...filters, sortField: field, sortDirection: newDirection, offset: 0 });
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
            placeholder="Search by composite name..."
            value={filters.name}
            onChange={(e) => onFilterChange({ ...filters, name: e.target.value, offset: 0 })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{totalComposites} composites found</span>
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
            {/* Pricing Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Mode
              </label>
              <select
                value={filters.pricingMode || ''}
                onChange={(e) => onFilterChange({ ...filters, pricingMode: e.target.value === '' ? undefined : e.target.value as 'FIXED' | 'DYNAMIC', offset: 0 })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Modes</option>
                <option value="FIXED">Fixed</option>
                <option value="DYNAMIC">Dynamic</option>
              </select>
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

            {/* Variant SKU Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Variant SKU
              </label>
              <input
                type="text"
                placeholder="Enter SKU (e.g., FIG-001)..."
                value={filters.variantSkuQuery}
                onChange={(e) => onFilterChange({ ...filters, variantSkuQuery: e.target.value, offset: 0 })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Search for composites containing variants with matching SKU
              </p>
            </div>

            {/* Sort Options */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                  onClick={() => handleSortChange('ITEM_COUNT')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'ITEM_COUNT'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Items</span>
                    {filters.sortField === 'ITEM_COUNT' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('CREATED_AT')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'CREATED_AT'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    {filters.sortField === 'CREATED_AT' && (
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
