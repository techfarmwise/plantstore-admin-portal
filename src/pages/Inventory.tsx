import React, { useState } from 'react';
import { Package, Plus, TrendingUp, TrendingDown, Search, History, Filter, X, ArrowUpDown } from 'lucide-react';
import { useStockSearch, useCreateAdjustment, useAdjustmentReasons, useAdjustments } from '../hooks/useInventory';
import { useWarehouses } from '../hooks/useWarehouses';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Stock, AdjustmentCreateRequest, StockSearchItem } from '../types/api';
import { InventoryAdjustmentModal } from '../components/inventory/AdjustmentModal';
import { useAuth } from '../contexts/AuthContext';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger'>('stock');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isNewAdjustmentModalOpen, setIsNewAdjustmentModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock filters
  const [stockFilters, setStockFilters] = useState({
    search: '',
    tags: [] as string[],
    sortField: 'PRODUCT_NAME' as 'PRODUCT_NAME' | 'SKU' | 'QUANTITY_AVAILABLE' | 'QUANTITY_TOTAL',
    sortDirection: 'ASC' as 'ASC' | 'DESC',
    limit: 25,
    offset: 0,
  });
  
  // Ledger filters
  const [ledgerFilters, setLedgerFilters] = useState({
    startDate: '',
    endDate: '',
    variantId: null as number | null,
    limit: 100,
  });

  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
  
  // Build stock search request
  const stockSearchRequest = React.useMemo(() => ({
    warehouseId: selectedWarehouseId || 0,
    search: stockFilters.search || undefined,
    tags: stockFilters.tags.length > 0 ? stockFilters.tags : undefined,
    sortField: stockFilters.sortField,
    sortDirection: stockFilters.sortDirection,
    limit: stockFilters.limit,
    offset: stockFilters.offset,
  }), [selectedWarehouseId, stockFilters]);
  
  const { data: stockSearchData, isLoading: isLoadingStock } = useStockSearch(
    stockSearchRequest,
    !!selectedWarehouseId
  );
  
  // Build adjustment query params
  const adjustmentParams = React.useMemo(() => {
    const params: any = {
      warehouseId: selectedWarehouseId || undefined,
      limit: ledgerFilters.limit,
    };
    
    if (ledgerFilters.startDate) {
      params.since = new Date(ledgerFilters.startDate).toISOString();
    }
    
    if (ledgerFilters.variantId) {
      params.variantId = ledgerFilters.variantId;
    }
    
    return params;
  }, [selectedWarehouseId, ledgerFilters]);
  
  const { data: adjustments = [], isLoading: isLoadingAdjustments } = useAdjustments(adjustmentParams);
  const { data: products = [] } = useProducts();
  const { data: adjustmentReasons = [] } = useAdjustmentReasons();
  const createAdjustmentMutation = useCreateAdjustment();

  // Set default warehouse on load
  React.useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].warehouseId);
    }
  }, [warehouses, selectedWarehouseId]);

  const handleAdjustment = async (data: {
    quantityDelta: number;
    reasonId: number;
    comment: string;
  }) => {
    if (!selectedStock) return;

    setAdjustmentError(null);

    try {
      const adjustmentData: AdjustmentCreateRequest = {
        variantId: selectedStock.variantId,
        warehouseId: selectedStock.warehouseId,
        quantityDelta: data.quantityDelta,
        reasonId: data.reasonId,
        comment: data.comment,
        createdBy: localStorage.getItem('userEmail') || 'admin',
        referenceType: 'MANUAL',
        referenceId: `ADJ-${Date.now()}`,
      };

      await createAdjustmentMutation.mutateAsync(adjustmentData);
      setIsAdjustmentModalOpen(false);
      setSelectedStock(null);
      setAdjustmentError(null);
    } catch (error: any) {
      console.error('Failed to create adjustment:', error);

      let errorMessage = 'An unexpected error occurred';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setAdjustmentError(errorMessage);
    }
  };

  // Get product/variant name helper
  const getVariantName = (variantId: number) => {
    for (const product of products) {
      const variant = product.variants?.find((v: any) => v.variantId === variantId);
      if (variant) {
        return `${product.name} - ${variant.sku}`;
      }
    }
    return `Variant #${variantId}`;
  };

  // Extract stock items from search response
  const stockItems = stockSearchData?.items || [];
  const totalStockItems = stockSearchData?.total || 0;

  // Filter adjustments based on end date (client-side)
  const filteredAdjustments = React.useMemo(() => {
    if (!ledgerFilters.endDate) return adjustments;
    
    const endDate = new Date(ledgerFilters.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    return adjustments.filter((adj) => {
      const adjDate = new Date(adj.createdAt);
      return adjDate <= endDate;
    });
  }, [adjustments, ledgerFilters.endDate]);

  // Clear all filters
  const handleClearFilters = () => {
    setLedgerFilters({
      startDate: '',
      endDate: '',
      variantId: null,
      limit: 100,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = !!(ledgerFilters.startDate || ledgerFilters.endDate || ledgerFilters.variantId);

  if (isLoadingWarehouses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage stock levels across warehouses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            onClick={() => setIsNewAdjustmentModalOpen(true)}
            disabled={!selectedWarehouseId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add/Update Inventory
          </Button>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {selectedWarehouseId && (
        <InventoryAdjustmentModal
          isOpen={isNewAdjustmentModalOpen}
          onClose={() => setIsNewAdjustmentModalOpen(false)}
          warehouseId={selectedWarehouseId}
          userEmail={user?.email || 'admin'}
        />
      )}

      {/* Warehouse Selector */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Warehouse
        </label>
        <select
          value={selectedWarehouseId || ''}
          onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
              {warehouse.name} ({warehouse.code})
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stock')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'stock'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Package className="inline-block h-5 w-5 mr-2" />
            Current Stock
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'ledger'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <History className="inline-block h-5 w-5 mr-2" />
            Adjustment Ledger
          </button>
        </nav>
      </div>

      {/* Content Area */}
      {activeTab === 'stock' ? (
        <>
          {/* Stock Filter Panel */}
          <StockFilterPanel
            filters={stockFilters}
            onFilterChange={setStockFilters}
            totalItems={totalStockItems}
          />

          {/* Stock Table */}
      {isLoadingStock ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="text-center py-12 mt-6 bg-white shadow rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stock items</h3>
          <p className="mt-1 text-sm text-gray-500">
            {stockFilters.search ? 'No items match your search.' : 'No stock available in this warehouse.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product / Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockItems.map((item: StockSearchItem) => (
                <tr key={`${item.variantId}-${item.warehouseId}`}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </div>
                    <div className="text-sm text-gray-500">{item.variantName} - {item.sku}</div>
                    {item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.quantityAvailable}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.quantityReserved}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantityTotal}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStock({
                          variantId: item.variantId,
                          warehouseId: item.warehouseId,
                          quantityAvailable: item.quantityAvailable,
                          quantityReserved: item.quantityReserved,
                        } as Stock);
                        setAdjustmentError(null);
                        setIsAdjustmentModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      ) : (
        /* Ledger View */
        <LedgerView
          adjustments={filteredAdjustments}
          isLoading={isLoadingAdjustments}
          getVariantName={getVariantName}
          adjustmentReasons={adjustmentReasons}
          filters={ledgerFilters}
          onFilterChange={setLedgerFilters}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          products={products}
        />
      )}

      {/* Adjustment Modal */}
      <AdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedStock(null);
          setAdjustmentError(null);
        }}
        stock={selectedStock}
        reasons={adjustmentReasons}
        onSubmit={handleAdjustment}
        isLoading={createAdjustmentMutation.isPending}
        error={adjustmentError}
        variantName={selectedStock ? getVariantName(selectedStock.variantId) : ''}
      />
    </div>
  );
};

// Adjustment Modal Component
interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  reasons: any[];
  onSubmit: (data: { quantityDelta: number; reasonId: number; comment: string }) => void;
  isLoading: boolean;
  error: string | null;
  variantName: string;
}

const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  stock,
  reasons,
  onSubmit,
  isLoading,
  error,
  variantName,
}) => {
  const [quantityDelta, setQuantityDelta] = useState<string>('');
  const [reasonId, setReasonId] = useState<string>('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      quantityDelta: Number(quantityDelta),
      reasonId: Number(reasonId),
      comment,
    });
  };

  if (!stock) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error adjusting stock</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">{variantName}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Available:</span>
              <span className="ml-2 font-medium">{stock.quantityAvailable}</span>
            </div>
            <div>
              <span className="text-gray-500">Reserved:</span>
              <span className="ml-2 font-medium">{stock.quantityReserved}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Change
          </label>
          <input
            type="number"
            value={quantityDelta}
            onChange={(e) => setQuantityDelta(e.target.value)}
            placeholder="Enter positive or negative number"
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Positive numbers increase stock, negative numbers decrease stock
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason
          </label>
          <select
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select a reason</option>
            {reasons.map((reason) => (
              <option key={reason.reasonId} value={reason.reasonId}>
                {reason.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add any additional notes..."
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Apply Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Ledger View Component
interface LedgerViewProps {
  adjustments: any[];
  isLoading: boolean;
  getVariantName: (variantId: number) => string;
  adjustmentReasons: any[];
  filters: {
    startDate: string;
    endDate: string;
    variantId: number | null;
    limit: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  products: any[];
}

const LedgerView: React.FC<LedgerViewProps> = ({
  adjustments,
  isLoading,
  getVariantName,
  adjustmentReasons,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  products,
}) => {
  const getReasonDisplay = (adjustment: any) => {
    // Use reasonDescription if available, otherwise use reasonCode
    if (adjustment.reasonDescription) {
      return adjustment.reasonDescription;
    }
    if (adjustment.reasonCode) {
      // Format the code to be more readable (e.g., "NEW_STOCK" -> "New Stock")
      return adjustment.reasonCode
        .split('_')
        .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 mt-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (adjustments.length === 0) {
    return (
      <>
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          products={products}
        />
        
        <div className="text-center py-12 mt-6 bg-white shadow rounded-lg">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No adjustments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'No adjustments match your filter criteria.' 
              : 'No stock adjustments have been made for this warehouse.'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
        products={products}
      />
      
      {/* Ledger Table */}
    <div className="mt-6 bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product / Variant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Comment
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              By
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {adjustments.map((adjustment) => (
            <tr key={adjustment.adjustmentId}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(adjustment.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {getVariantName(adjustment.variantId)}
                </div>
                <div className="text-sm text-gray-500">Variant ID: {adjustment.variantId}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    adjustment.quantityDelta > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {adjustment.quantityDelta > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {adjustment.quantityDelta > 0 ? '+' : ''}
                  {adjustment.quantityDelta}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {adjustment.entryType || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {getReasonDisplay(adjustment)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {adjustment.referenceType && adjustment.referenceId ? (
                  <div>
                    <div className="text-xs text-gray-400">{adjustment.referenceType}</div>
                    <div className="font-medium">{adjustment.referenceId}</div>
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {adjustment.comment || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {adjustment.createdBy || 'System'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

// Filter Panel Component
interface FilterPanelProps {
  filters: {
    startDate: string;
    endDate: string;
    variantId: number | null;
    limit: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  products: any[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  products,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="mt-6 bg-white shadow rounded-lg">
      {/* Filter Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* Variant Filter (Placeholder for future) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Variant
              </label>
              <select
                value={filters.variantId || ''}
                onChange={(e) => onFilterChange({ ...filters, variantId: e.target.value ? Number(e.target.value) : null })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Variants</option>
                {products.map((product) =>
                  product.variants?.map((variant: any) => (
                    <option key={variant.variantId} value={variant.variantId}>
                      {product.name} - {variant.sku}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Limit
              </label>
              <select
                value={filters.limit}
                onChange={(e) => onFilterChange({ ...filters, limit: Number(e.target.value) })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          {/* Filter Info */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Active filters:</strong>{' '}
                {filters.startDate && `From ${new Date(filters.startDate).toLocaleDateString()}`}
                {filters.startDate && filters.endDate && ' • '}
                {filters.endDate && `To ${new Date(filters.endDate).toLocaleDateString()}`}
                {filters.variantId && ` • Variant ID: ${filters.variantId}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stock Filter Panel Component
interface StockFilterPanelProps {
  filters: {
    search: string;
    tags: string[];
    sortField: 'PRODUCT_NAME' | 'SKU' | 'QUANTITY_AVAILABLE' | 'QUANTITY_TOTAL';
    sortDirection: 'ASC' | 'DESC';
    limit: number;
    offset: number;
  };
  onFilterChange: (filters: any) => void;
  totalItems: number;
}

const StockFilterPanel: React.FC<StockFilterPanelProps> = ({
  filters,
  onFilterChange,
  totalItems,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search, offset: 0 });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      onFilterChange({ ...filters, tags: [...filters.tags, tagInput.trim()], offset: 0 });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onFilterChange({ ...filters, tags: filters.tags.filter(t => t !== tag), offset: 0 });
  };

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
            placeholder="Search by product name, SKU, or tags..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        {/* Results Info */}
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>{totalItems} items found</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            <Filter className="h-4 w-4 mr-1" />
            {isExpanded ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tag Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <Button size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {filters.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 inline-flex items-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSortChange('PRODUCT_NAME')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'PRODUCT_NAME'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    {filters.sortField === 'PRODUCT_NAME' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('SKU')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'SKU'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>SKU</span>
                    {filters.sortField === 'SKU' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('QUANTITY_AVAILABLE')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'QUANTITY_AVAILABLE'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Available</span>
                    {filters.sortField === 'QUANTITY_AVAILABLE' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSortChange('QUANTITY_TOTAL')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'QUANTITY_TOTAL'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    {filters.sortField === 'QUANTITY_TOTAL' && (
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
