import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { variantService } from '../../services/variants';
import { inventoryService } from '../../services/inventory';
import { VariantSearchLiteItem, AdjustmentReason, AdjustmentCreateRequest } from '../../types/api';
import { cn } from '../../utils/cn';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number;
  userEmail: string;
}

export const InventoryAdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  userEmail,
}) => {
  const queryClient = useQueryClient();
  const [skuQuery, setSkuQuery] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<VariantSearchLiteItem | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quantityDelta, setQuantityDelta] = useState<string>('');
  const [reasonId, setReasonId] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const { data: variantSuggestions, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['variant-search-lite', skuQuery],
    queryFn: () => variantService.searchLite({ query: skuQuery, limit: 10 }),
    enabled: skuQuery.trim().length > 0,
    staleTime: 30000,
  });

  const { data: reasons } = useQuery<AdjustmentReason[]>({
    queryKey: ['adjustment-reasons'],
    queryFn: () => inventoryService.getAdjustmentReasons(),
  });

  const { mutate: createAdjustment, isPending: isCreating } = useMutation({
    mutationFn: (data: AdjustmentCreateRequest) => inventoryService.createAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      handleClose();
    },
  });

  useEffect(() => {
    if (selectedVariant) {
      inventoryService
        .searchStock({
          variantIds: [selectedVariant.variantId],
          warehouseId,
          limit: 1,
        })
        .then((response) => {
          if (response.items.length > 0) {
            setCurrentStock(response.items[0].quantityAvailable);
          } else {
            setCurrentStock(0);
          }
        })
        .catch(() => {
          setCurrentStock(null);
        });
    }
  }, [selectedVariant, warehouseId]);

  const handleClose = () => {
    setSkuQuery('');
    setSelectedVariant(null);
    setShowSuggestions(false);
    setQuantityDelta('');
    setReasonId('');
    setComment('');
    setCurrentStock(null);
    onClose();
  };

  const handleSelectVariant = (variant: VariantSearchLiteItem) => {
    setSelectedVariant(variant);
    setSkuQuery(variant.sku);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariant || !quantityDelta || reasonId === '') {
      return;
    }

    const delta = parseInt(quantityDelta, 10);
    if (isNaN(delta)) {
      return;
    }

    createAdjustment({
      variantId: selectedVariant.variantId,
      warehouseId,
      quantityDelta: delta,
      reasonId: reasonId as number,
      comment: comment.trim() || undefined,
      createdBy: userEmail,
      referenceType: 'MANUAL',
      referenceId: `UI-${Date.now()}`,
    });
  };

  if (!isOpen) return null;

  const isFormValid = selectedVariant && quantityDelta && reasonId !== '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add/Update Inventory</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={skuQuery}
                onChange={(e) => {
                  setSkuQuery(e.target.value);
                  setShowSuggestions(true);
                  if (selectedVariant && e.target.value !== selectedVariant.sku) {
                    setSelectedVariant(null);
                    setCurrentStock(null);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter SKU or variant name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              
              {showSuggestions && skuQuery.trim() && variantSuggestions?.items && variantSuggestions.items.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {isLoadingVariants ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                  ) : (
                    variantSuggestions.items.map((variant) => (
                      <button
                        key={variant.variantId}
                        type="button"
                        onMouseDown={() => handleSelectVariant(variant)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{variant.displayName}</div>
                        <div className="text-sm text-gray-500">SKU: {variant.sku}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={selectedVariant?.displayName || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                placeholder="Select a variant from SKU search"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse
              </label>
              <input
                type="text"
                value={`Warehouse ID: ${warehouseId}`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            {currentStock !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Current Available Stock:</span> {currentStock} units
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Change <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(e.target.value)}
                placeholder="Enter positive or negative number (e.g., +10 or -5)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use positive numbers to increase stock, negative to decrease
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select a reason</option>
                {reasons?.map((reason) => (
                  <option key={reason.reasonId} value={reason.reasonId}>
                    {reason.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isCreating}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-md',
                  isFormValid && !isCreating
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {isCreating ? 'Submitting...' : 'Submit Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
