import React, { useState, useEffect } from 'react';
import { CompositeCreateRequest, CompositeResponse, VariantSearchLiteItem } from '../../types/api';
import { Button } from '../ui/Button';
import { VariantAutocomplete } from '../ui/VariantAutocomplete';
import { Plus, Trash2 } from 'lucide-react';

interface CompositeFormProps {
  initialData?: CompositeResponse;
  onSubmit: (data: CompositeCreateRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const CompositeForm: React.FC<CompositeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<CompositeCreateRequest>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    pricingMode: initialData?.pricingMode || 'FIXED',
    fixedPrice: initialData?.fixedPrice || undefined,
    active: initialData?.active ?? true,
    items: initialData?.items.map(item => ({
      variantId: item.variant.variantId,
      quantityRequired: item.quantityRequired,
    })) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<(VariantSearchLiteItem | null)[]>(
    formData.items.map(() => null)
  );

  useEffect(() => {
    if (initialData) {
      // Convert CompositeItemWithVariant to CompositeItem for form data
      const formItems = initialData.items.map(item => ({
        variantId: item.variant.variantId,
        quantityRequired: item.quantityRequired,
      }));

      setFormData({
        name: initialData.name,
        description: initialData.description,
        pricingMode: initialData.pricingMode,
        fixedPrice: initialData.fixedPrice || undefined,
        active: initialData.active,
        items: formItems,
      });
      
      // Create variant objects from the actual API response
      const variantsFromResponse = initialData.items.map(item => ({
        variantId: item.variant.variantId,
        displayName: item.variant.name,
        sku: item.variant.sku,
      }));
      setSelectedVariants(variantsFromResponse);
    }
  }, [initialData]);

  // Sync selectedVariants when items change length (add/remove)
  useEffect(() => {
    if (selectedVariants.length !== formData.items.length) {
      const newSelectedVariants = formData.items.map((item, index) => {
        // Keep existing selection if available
        if (selectedVariants[index]) {
          return selectedVariants[index];
        }
        // Create placeholder for new items
        const variantId = item?.variantId;
        if (variantId && variantId > 0) {
          return {
            variantId,
            displayName: `Variant #${variantId}`,
            sku: `ID-${variantId}`,
          };
        }
        return null;
      });
      setSelectedVariants(newSelectedVariants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items.length]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.pricingMode === 'FIXED' && (!formData.fixedPrice || formData.fixedPrice <= 0)) {
      newErrors.fixedPrice = 'Fixed price must be greater than 0';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.variantId || item.variantId <= 0) {
        newErrors[`item_${index}_variantId`] = 'Valid variant ID is required';
      }
      if (!item.quantityRequired || item.quantityRequired <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { variantId: 0, quantityRequired: 1 }],
    });
    setSelectedVariants([...selectedVariants, null]);
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
    setSelectedVariants(selectedVariants.filter((_, i) => i !== index));
  };

  const handleVariantSelect = (index: number, variant: VariantSearchLiteItem | null) => {
    const newSelectedVariants = [...selectedVariants];
    newSelectedVariants[index] = variant;
    setSelectedVariants(newSelectedVariants);

    if (variant) {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], variantId: variant.variantId };
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleItemChange = (index: number, field: 'variantId' | 'quantityRequired', value: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.description
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
        
        <div>
          <label htmlFor="pricingMode" className="block text-sm font-medium text-gray-700">
            Pricing Mode *
          </label>
          <select
            id="pricingMode"
            value={formData.pricingMode}
            onChange={(e) => setFormData({ ...formData, pricingMode: e.target.value as 'FIXED' | 'DYNAMIC' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="FIXED">Fixed Price</option>
            <option value="DYNAMIC">Dynamic Price (Sum of items)</option>
          </select>
        </div>

        {formData.pricingMode === 'FIXED' && (
          <div>
            <label htmlFor="fixedPrice" className="block text-sm font-medium text-gray-700">
              Fixed Price *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="fixedPrice"
                step="0.01"
                min="0"
                value={formData.fixedPrice || ''}
                onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value ? Number(e.target.value) : undefined })}
                className={`block w-full pl-7 pr-12 rounded-md sm:text-sm ${
                  errors.fixedPrice
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
            </div>
            {errors.fixedPrice && <p className="mt-1 text-sm text-red-600">{errors.fixedPrice}</p>}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <Button type="button" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant *
                  </label>
                  <VariantAutocomplete
                    value={selectedVariants[index]}
                    onChange={(variant) => handleVariantSelect(index, variant)}
                    placeholder="Search by product name or SKU..."
                    error={errors[`item_${index}_variantId`]}
                  />
                  {selectedVariants[index] && (
                    <div className="mt-1 text-xs text-gray-500">
                      Selected: Variant ID {selectedVariants[index]?.variantId}
                      {selectedVariants[index]?.sku.startsWith('ID-') && (
                        <span className="ml-2 text-gray-400">(Search to see full details)</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantityRequired || ''}
                    onChange={(e) => handleItemChange(index, 'quantityRequired', Number(e.target.value))}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${
                      errors[`item_${index}_quantity`]
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveItem(index)}
                className="mt-6"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update' : 'Create'} Composite
        </Button>
      </div>
    </form>
  );
};
