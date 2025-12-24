import React, { useState, useEffect } from 'react';
import { CompositeCreateRequest, CompositeResponse, VariantSearchLiteItem, CompositeDetailMetadata } from '../../types/api';
import { Button } from '../ui/Button';
import { VariantAutocomplete } from '../ui/VariantAutocomplete';
import { Plus, Trash2, Info, FileText, Package } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'items'>('basic');
  const [keyHighlightsText, setKeyHighlightsText] = useState('');
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
    detailMetadata: initialData?.detailMetadata || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<(VariantSearchLiteItem | null)[]>(
    formData.items.map(() => null)
  );

  useEffect(() => {
    if (initialData) {
      // Set key highlights text if available
      if (initialData.detailMetadata?.keyHighlights) {
        setKeyHighlightsText(initialData.detailMetadata.keyHighlights.join(', '));
      }

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
        detailMetadata: initialData.detailMetadata || undefined,
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

  const handleAddFaq = () => {
    const currentFaqs = formData.detailMetadata?.faqs || [];
    setFormData({
      ...formData,
      detailMetadata: {
        ...formData.detailMetadata,
        faqs: [...currentFaqs, { question: '', answer: '' }],
      }
    });
  };

  const handleRemoveFaq = (index: number) => {
    const currentFaqs = formData.detailMetadata?.faqs || [];
    setFormData({
      ...formData,
      detailMetadata: {
        ...formData.detailMetadata,
        faqs: currentFaqs.filter((_, i) => i !== index),
      }
    });
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const currentFaqs = [...(formData.detailMetadata?.faqs || [])];
    currentFaqs[index] = { ...currentFaqs[index], [field]: value };
    setFormData({
      ...formData,
      detailMetadata: {
        ...formData.detailMetadata,
        faqs: currentFaqs,
      }
    });
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: Info },
    { id: 'details' as const, label: 'Composite Details', icon: FileText },
    { id: 'items' as const, label: 'Items', icon: Package },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">

      {/* Basic Information */}
      {activeTab === 'basic' && (
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
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
        {/* Pricing */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Pricing</h4>
          
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
            <div className="mt-4">
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
      </div>
      )}

      {/* Composite Details */}
      {activeTab === 'details' && (
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Bundle Details (Optional)</h3>
        <p className="text-sm text-gray-600">Add rich content for the bundle detail page</p>
        
        <div>
          <label htmlFor="aboutProduct" className="block text-sm font-medium text-gray-700">
            About Bundle
          </label>
          <textarea
            id="aboutProduct"
            rows={4}
            value={formData.detailMetadata?.aboutProduct || ''}
            onChange={(e) => setFormData({
              ...formData,
              detailMetadata: {
                ...formData.detailMetadata,
                aboutProduct: e.target.value,
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Detailed description about the bundle..."
          />
        </div>

        <div>
          <label htmlFor="keyHighlights" className="block text-sm font-medium text-gray-700">
            Key Highlights (comma-separated)
          </label>
          <textarea
            id="keyHighlights"
            rows={3}
            value={keyHighlightsText}
            onChange={(e) => setKeyHighlightsText(e.target.value)}
            onBlur={(e) => {
              const highlights = e.target.value.split(',').map(h => h.trim()).filter(h => h.length > 0);
              setFormData({
                ...formData,
                detailMetadata: {
                  ...formData.detailMetadata,
                  keyHighlights: highlights.length > 0 ? highlights : undefined,
                }
              });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Save 20% vs individual purchase, Beginner-friendly selection, Includes care guide"
          />
          <p className="mt-1 text-xs text-gray-500">Separate each highlight with a comma</p>
        </div>

        {/* FAQs */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Frequently Asked Questions</h4>
            <Button
              type="button"
              onClick={handleAddFaq}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add FAQ
            </Button>
          </div>
          {(!formData.detailMetadata?.faqs || formData.detailMetadata.faqs.length === 0) ? (
            <p className="text-sm text-gray-500 italic">No FAQs added yet. Click "Add FAQ" to add one.</p>
          ) : (
            <div className="space-y-4">
              {formData.detailMetadata.faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">FAQ {index + 1}</h5>
                    <Button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g., What's included in this bundle?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Answer
                      </label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Provide a detailed answer..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Benefits</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="freeDeliveryThreshold" className="block text-sm font-medium text-gray-700">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                id="freeDeliveryThreshold"
                min="0"
                value={formData.detailMetadata?.benefits?.freeDeliveryThreshold || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  detailMetadata: {
                    ...formData.detailMetadata,
                    benefits: {
                      ...formData.detailMetadata?.benefits,
                      freeDeliveryThreshold: e.target.value ? Number(e.target.value) : undefined,
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="replacementDays" className="block text-sm font-medium text-gray-700">
                Replacement Days
              </label>
              <input
                type="number"
                id="replacementDays"
                min="0"
                value={formData.detailMetadata?.benefits?.replacementDays || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  detailMetadata: {
                    ...formData.detailMetadata,
                    benefits: {
                      ...formData.detailMetadata?.benefits,
                      replacementDays: e.target.value ? Number(e.target.value) : undefined,
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="7"
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="supportAvailable"
                checked={formData.detailMetadata?.benefits?.supportAvailable || false}
                onChange={(e) => setFormData({
                  ...formData,
                  detailMetadata: {
                    ...formData.detailMetadata,
                    benefits: {
                      ...formData.detailMetadata?.benefits,
                      supportAvailable: e.target.checked,
                    }
                  }
                })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="supportAvailable" className="ml-2 block text-sm text-gray-900">
                Support Available
              </label>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Items */}
      {activeTab === 'items' && (
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
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
      )}

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
