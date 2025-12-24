import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Upload, Info, Package, FileText } from 'lucide-react';
import { ProductCreateRequest, ProductUpdateRequest, ProductResponse, ProductVariant, ProductImage, ProductPricing, ProductMediaType, ProductDetailMetadata } from '../../types/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCategories } from '../../hooks/useCategories';

// Validation schemas
const mediaTypes: ProductMediaType[] = ['IMAGE', 'VIDEO'];

const mediaTypeSchema = z.custom<ProductMediaType>((val) => typeof val === 'string' && (mediaTypes as string[]).includes(val), {
  message: 'Media type must be IMAGE or VIDEO',
});

const productImageSchema = z.object({
  url: z.string().url('Invalid media URL'),
  altText: z.string().min(1, 'Alt text is required'),
  primary: z.boolean(),
  sortOrder: z.number().min(1),
  mediaType: mediaTypeSchema,
  metadata: z
    .object({
      width: z.any().optional(),
      height: z.any().optional(),
      focalPoint: z.string().optional(),
      durationSeconds: z.any().optional(),
      thumbnailUrl: z.string().optional(),
    })
    .partial()
    .optional(),
});

const productPricingSchema = z.object({
  mrp: z.number().min(0, 'MRP must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  discountPercent: z.number().min(0).max(100, 'Discount must be between 0-100'),
  startDatetime: z.string().optional(),
  endDatetime: z.string().optional(),
  active: z.boolean(),
});

const productVariantSchema = z.object({
  variantId: z.number().optional(),
  sku: z.string().min(1, 'SKU is required'),
  size: z.string().optional(),
  color: z.string().optional(),
  style: z.string().optional(),
  basePrice: z.number().min(0, 'Base price must be positive'),
  weightGrams: z.number().min(0, 'Weight must be positive'),
  dimensions: z.string().optional(),
  images: z.array(productImageSchema).min(1, 'At least one image is required'),
  pricing: productPricingSchema,
});

const careInfoSchema = z.object({
  water: z.string().optional(),
  light: z.string().optional(),
  temperature: z.string().optional(),
  difficulty: z.string().optional(),
  petFriendly: z.boolean().optional(),
  petWarning: z.string().optional(),
}).optional();

const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

const benefitsSchema = z.object({
  freeDeliveryThreshold: z.number().min(0).optional(),
  replacementDays: z.number().min(0).optional(),
  supportAvailable: z.boolean().optional(),
}).optional();

const detailMetadataSchema = z.object({
  careInfo: careInfoSchema,
  aboutProduct: z.string().optional(),
  keyHighlights: z.array(z.string()).optional(),
  faqs: z.array(faqSchema).optional(),
  benefits: benefitsSchema,
}).optional();

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  categoryLabel: z.string().min(1, 'Category label is required'),
  description: z.string().min(1, 'Description is required'),
  active: z.boolean(),
  categoryIds: z.array(z.number()).min(1, 'At least one category is required'),
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
  detailMetadata: detailMetadataSchema,
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: ProductResponse;
  onSubmit: (data: ProductCreateRequest | ProductUpdateRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'variants'>('basic');
  const [activeVariantTab, setActiveVariantTab] = useState(0);
  const [keyHighlightsText, setKeyHighlightsText] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      categoryLabel: initialData.categoryLabel,
      description: initialData.description,
      active: initialData.active,
      categoryIds: initialData.categories?.map((cat: any) => cat.categoryId) || initialData.categoryIds || [],
      detailMetadata: initialData.detailMetadata || undefined,
      variants: initialData.variants?.map(variant => ({
        ...variant,
        dimensions: variant.dimensions || '',
        size: variant.size || '',
        color: variant.color || '',
        style: variant.style || '',
        pricing: {
          ...variant.pricing,
          startDatetime: variant.pricing.startDatetime || '',
          endDatetime: variant.pricing.endDatetime || '',
        }
      })) || [
        {
          sku: '',
          size: '',
          color: '',
          style: '',
          basePrice: 0,
          weightGrams: 0,
          dimensions: '',
          images: [
            {
              url: '',
              altText: '',
              primary: true,
              sortOrder: 1,
              mediaType: 'IMAGE',
              metadata: {
                width: undefined,
                height: undefined,
                focalPoint: '',
                durationSeconds: undefined,
                thumbnailUrl: '',
              },
            },
          ],
          pricing: {
            mrp: 0,
            sellingPrice: 0,
            discountPercent: 0,
            startDatetime: '',
            endDatetime: '',
            active: true,
          },
        },
      ],
    } : {
      name: '',
      categoryLabel: '',
      description: '',
      active: true,
      categoryIds: [],
      detailMetadata: undefined,
      variants: [
        {
          sku: '',
          size: '',
          color: '',
          style: '',
          basePrice: 0,
          weightGrams: 0,
          dimensions: '',
          images: [
            {
              url: '',
              altText: '',
              primary: true,
              sortOrder: 1,
            },
          ],
          pricing: {
            mrp: 0,
            sellingPrice: 0,
            discountPercent: 0,
            startDatetime: '',
            endDatetime: '',
            active: true,
          },
        },
      ],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: 'detailMetadata.faqs',
  });

  const watchedVariants = watch('variants');
  const watchedCategoryIds = watch('categoryIds');

  // Initialize keyHighlightsText from form data
  useEffect(() => {
    const highlights = watch('detailMetadata.keyHighlights');
    if (highlights && highlights.length > 0) {
      setKeyHighlightsText(highlights.join(', '));
    }
  }, []);

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      console.log('🔄 Resetting form with initialData:', initialData);
      
      // Set key highlights text if available
      if (initialData.detailMetadata?.keyHighlights) {
        setKeyHighlightsText(initialData.detailMetadata.keyHighlights.join(', '));
      }
      
      // Extract category IDs from the categories array in the API response
      const categoryIds = initialData.categories?.map((cat: any) => cat.categoryId) || initialData.categoryIds || [];
      
      console.log('📋 Product categories from API:', initialData.categories);
      console.log('📋 Extracted categoryIds:', categoryIds);
      console.log('📂 Available categories:', categories);
      
      const formData = {
        name: initialData.name,
        categoryLabel: initialData.categoryLabel || '',
        description: initialData.description,
        active: initialData.active,
        categoryIds: categoryIds,
        detailMetadata: initialData.detailMetadata ? {
          careInfo: initialData.detailMetadata.careInfo || {},
          aboutProduct: initialData.detailMetadata.aboutProduct || '',
          keyHighlights: initialData.detailMetadata.keyHighlights || [],
          faqs: initialData.detailMetadata.faqs || [],
          benefits: initialData.detailMetadata.benefits || {},
        } : undefined,
        variants: initialData.variants?.map(variant => ({
          ...variant,
          dimensions: variant.dimensions || '',
          size: variant.size || '',
          color: variant.color || '',
          style: variant.style || '',
          images: variant.images?.map(image => ({
            ...image,
            mediaType: image.mediaType || 'IMAGE',
            metadata: image.metadata || {},
          })) || [
            {
              url: '',
              altText: '',
              primary: true,
              sortOrder: 1,
              mediaType: 'IMAGE',
              metadata: {},
            },
          ],
          pricing: {
            ...variant.pricing,
            startDatetime: variant.pricing.startDatetime || '',
            endDatetime: variant.pricing.endDatetime || '',
          }
        })) || []
      };
      
      console.log('📝 CategoryLabel from API:', initialData.categoryLabel);
      console.log('📝 Form data being set:', formData);
      reset(formData);
    }
  }, [initialData, reset, categories]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const currentIds = watchedCategoryIds || [];
    if (checked) {
      setValue('categoryIds', [...currentIds, categoryId]);
    } else {
      setValue('categoryIds', currentIds.filter(id => id !== categoryId));
    }
  };

  const addVariant = () => {
    appendVariant({
      sku: '',
      size: '',
      color: '',
      style: '',
      basePrice: 0,
      weightGrams: 0,
      dimensions: '',
      images: [
        {
          url: '',
          altText: '',
          primary: true,
          sortOrder: 1,
          mediaType: 'IMAGE',
          metadata: {},
        },
      ],
      pricing: {
        mrp: 0,
        sellingPrice: 0,
        discountPercent: 0,
        startDatetime: '',
        endDatetime: '',
        active: true,
      },
    });
    setActiveVariantTab(variantFields.length);
  };

  const addImageToVariant = (variantIndex: number) => {
    const currentImages = watchedVariants[variantIndex]?.images || [];
    const newImage = {
      url: '',
      altText: '',
      primary: false,
      sortOrder: currentImages.length + 1,
      mediaType: 'IMAGE' as const,
      metadata: {},
    };
    setValue(`variants.${variantIndex}.images`, [...currentImages, newImage]);
  };

  const removeImageFromVariant = (variantIndex: number, imageIndex: number) => {
    const currentImages = watchedVariants[variantIndex]?.images || [];
    const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
    setValue(`variants.${variantIndex}.images`, updatedImages);
  };

  const sanitizeMetadata = (metadata?: Record<string, any>) => {
    if (!metadata) return undefined;
    const sanitized: Record<string, string | number | boolean> = {};
    Object.entries(metadata).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (typeof value === 'number') {
        if (!Number.isNaN(value)) {
          sanitized[key] = value;
        }
        return;
      }
      // Handle string numbers from input fields
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return;
        
        // Try to convert to number for numeric fields
        if (['width', 'height', 'durationSeconds'].includes(key)) {
          const num = Number(trimmed);
          if (!Number.isNaN(num) && num >= 0) {
            sanitized[key] = num;
          }
          return;
        }
        
        // For URL fields, validate
        if (key === 'thumbnailUrl') {
          const urlRegex = /^https?:\/\/.+/;
          if (urlRegex.test(trimmed)) {
            sanitized[key] = trimmed;
          }
          return;
        }
        
        // For other string fields
        sanitized[key] = trimmed;
        return;
      }
      if (typeof value === 'boolean') {
        sanitized[key] = value;
        return;
      }
    });
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  };

  const handleFormSubmit = (data: ProductFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);

    const sanitizedVariants = data.variants.map((variant) => {
      const sanitized = {
        ...variant,
        images: variant.images.map((image) => ({
          ...image,
          metadata: sanitizeMetadata(image.metadata || {}),
        })),
      };
      // Log variant info for debugging
      console.log(`Variant ${variant.sku}:`, variant.variantId ? `Updating (ID: ${variant.variantId})` : 'Creating new');
      return sanitized;
    });

    if (initialData) {
      // Update request - exclude categoryLabel, include productId
      const updateData: ProductUpdateRequest = {
        productId: initialData.productId,
        name: data.name,
        description: data.description,
        active: data.active,
        categoryIds: data.categoryIds,
        detailMetadata: data.detailMetadata as ProductDetailMetadata | undefined,
        variants: sanitizedVariants as ProductVariant[],
      };
      console.log('Final update data:', updateData);
      onSubmit(updateData);
    } else {
      // Create request - include categoryLabel
      const createData: ProductCreateRequest = {
        name: data.name,
        categoryLabel: data.categoryLabel,
        description: data.description,
        active: data.active,
        categoryIds: data.categoryIds,
        detailMetadata: data.detailMetadata as ProductDetailMetadata | undefined,
        variants: sanitizedVariants as ProductVariant[],
      };
      console.log('Final create data:', createData);
      onSubmit(createData);
    }
  };

  const handleFormError = (errors: any) => {
    console.log('Form validation errors:', errors);
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: Info },
    { id: 'details' as const, label: 'Product Details', icon: FileText },
    { id: 'variants' as const, label: 'Variants & Pricing', icon: Package },
  ];

  // Helper to determine which tab has errors
  const getTabErrors = () => {
    const tabErrors: Record<string, string[]> = {
      basic: [],
      details: [],
      variants: [],
    };

    if (errors.name) tabErrors.basic.push('Product Name is required');
    if (errors.categoryLabel) tabErrors.basic.push('Category Label is required');
    if (errors.description) tabErrors.basic.push('Description is required');
    if (errors.categoryIds) tabErrors.basic.push('At least one category is required');
    if (errors.active) tabErrors.basic.push('Active status error');

    if (errors.detailMetadata) {
      if (errors.detailMetadata.careInfo) tabErrors.details.push('Care Information has errors');
      if (errors.detailMetadata.faqs) tabErrors.details.push('FAQs have errors');
      if (errors.detailMetadata.benefits) tabErrors.details.push('Benefits have errors');
    }

    if (errors.variants && Array.isArray(errors.variants)) {
      errors.variants.forEach((variantError, index) => {
        if (variantError) {
          tabErrors.variants.push(`Variant ${index + 1} has errors`);
        }
      });
    }

    return tabErrors;
  };

  const tabErrors = getTabErrors();
  const hasErrors = Object.values(tabErrors).some(errs => errs.length > 0);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const hasTabErrors = tabErrors[tab.id]?.length > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm relative
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
                {hasTabErrors && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Validation Error Summary */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {Object.entries(tabErrors).map(([tabId, errs]) => {
                  if (errs.length === 0) return null;
                  const tab = tabs.find(t => t.id === tabId);
                  return (
                    <div key={tabId} className="mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab(tabId as 'basic' | 'details' | 'variants')}
                        className="font-medium text-red-800 hover:text-red-900 underline"
                      >
                        {tab?.label}:
                      </button>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {errs.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error {initialData ? 'updating' : 'creating'} product
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {/* Basic Product Information */}
        {activeTab === 'basic' && (
          <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Product Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Snake Plant"
          />

          <Input
            label="Category Label"
            {...register('categoryLabel')}
            error={errors.categoryLabel?.message}
            placeholder="e.g., Indoor Plants"
          />

          <div className="sm:col-span-2">
            <Input
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Detailed product description"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {categories.map((category) => {
                const isChecked = watchedCategoryIds?.includes(category.categoryId) || false;
                console.log(`🏷️ Category ${category.name} (ID: ${category.categoryId}):`, {
                  isChecked,
                  watchedCategoryIds,
                  includes: watchedCategoryIds?.includes(category.categoryId)
                });
                
                return (
                  <label key={category.categoryId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleCategoryChange(category.categoryId, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                );
              })}
            </div>
            {errors.categoryIds && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryIds.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('active')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label className="ml-2 text-sm text-gray-700">Active Product</label>
          </div>
        </div>
      </div>
        )}

        {/* Product Detail Metadata (Optional) */}
        {activeTab === 'details' && (
          <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">Add rich content for the product detail page</p>
        
        <div className="space-y-6">
          {/* About Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Product
            </label>
            <textarea
              {...register('detailMetadata.aboutProduct')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Detailed description about the product..."
            />
          </div>

          {/* Key Highlights */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Highlights (comma-separated)
            </label>
            <textarea
              value={keyHighlightsText}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NASA-approved air purifier, Releases oxygen at night, Low maintenance"
              onChange={(e) => {
                setKeyHighlightsText(e.target.value);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                const highlights = value.split(',').map(h => h.trim()).filter(h => h.length > 0);
                setValue('detailMetadata.keyHighlights', highlights.length > 0 ? highlights : undefined as any);
              }}
            />
            <p className="mt-1 text-xs text-gray-500">Separate each highlight with a comma</p>
          </div>

          {/* FAQs */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Frequently Asked Questions</h4>
              <Button
                type="button"
                onClick={() => appendFaq({ question: '', answer: '' })}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add FAQ
              </Button>
            </div>
            {faqFields.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No FAQs added yet. Click "Add FAQ" to add one.</p>
            ) : (
              <div className="space-y-4">
                {faqFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">FAQ {index + 1}</h5>
                      <Button
                        type="button"
                        onClick={() => removeFaq(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Question"
                        {...register(`detailMetadata.faqs.${index}.question`)}
                        error={errors.detailMetadata?.faqs?.[index]?.question?.message}
                        placeholder="e.g., How often should I water this plant?"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Answer
                        </label>
                        <textarea
                          {...register(`detailMetadata.faqs.${index}.answer`)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Provide a detailed answer..."
                        />
                        {errors.detailMetadata?.faqs?.[index]?.answer && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.detailMetadata.faqs[index]?.answer?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Care Information */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Care Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Water"
                {...register('detailMetadata.careInfo.water')}
                placeholder="e.g., Once a week"
              />
              <Input
                label="Light"
                {...register('detailMetadata.careInfo.light')}
                placeholder="e.g., Indirect bright light"
              />
              <Input
                label="Temperature"
                {...register('detailMetadata.careInfo.temperature')}
                placeholder="e.g., 18-25°C"
              />
              <Input
                label="Difficulty"
                {...register('detailMetadata.careInfo.difficulty')}
                placeholder="e.g., Easy"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('detailMetadata.careInfo.petFriendly')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700">Pet Friendly</label>
              </div>
              <Input
                label="Pet Warning (if not pet friendly)"
                {...register('detailMetadata.careInfo.petWarning')}
                placeholder="e.g., Toxic to cats and dogs"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Benefits</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Free Delivery Threshold (₹)"
                type="number"
                {...register('detailMetadata.benefits.freeDeliveryThreshold', { valueAsNumber: true })}
                placeholder="500"
              />
              <Input
                label="Replacement Days"
                type="number"
                {...register('detailMetadata.benefits.replacementDays', { valueAsNumber: true })}
                placeholder="7"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('detailMetadata.benefits.supportAvailable')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700">Support Available</label>
              </div>
            </div>
          </div>
        </div>
      </div>
        )}

        {/* Product Variants */}
        {activeTab === 'variants' && (
          <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <Button type="button" onClick={addVariant} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>

        {/* Variant Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {variantFields.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveVariantTab(index)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeVariantTab === index
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Variant {index + 1}
                {variantFields.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariant(index);
                      if (activeVariantTab >= index && activeVariantTab > 0) {
                        setActiveVariantTab(activeVariantTab - 1);
                      }
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Variant Form */}
        {variantFields.map((field, variantIndex) => (
          <div
            key={field.id}
            className={`space-y-6 ${variantIndex === activeVariantTab ? 'block' : 'hidden'}`}
          >
            {/* Variant Basic Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Input
                label="SKU"
                {...register(`variants.${variantIndex}.sku`)}
                error={errors.variants?.[variantIndex]?.sku?.message}
                placeholder="e.g., SNK-001"
              />

              <Input
                label="Size"
                {...register(`variants.${variantIndex}.size`)}
                error={errors.variants?.[variantIndex]?.size?.message}
                placeholder="e.g., Medium"
              />

              <Input
                label="Color"
                {...register(`variants.${variantIndex}.color`)}
                error={errors.variants?.[variantIndex]?.color?.message}
                placeholder="e.g., Green"
              />

              <Input
                label="Style"
                {...register(`variants.${variantIndex}.style`)}
                error={errors.variants?.[variantIndex]?.style?.message}
                placeholder="e.g., Ceramic Pot"
              />

              <Input
                label="Base Price"
                type="number"
                step="0.01"
                {...register(`variants.${variantIndex}.basePrice`, { valueAsNumber: true })}
                error={errors.variants?.[variantIndex]?.basePrice?.message}
                placeholder="599.00"
              />

              <Input
                label="Weight (grams)"
                type="number"
                {...register(`variants.${variantIndex}.weightGrams`, { valueAsNumber: true })}
                error={errors.variants?.[variantIndex]?.weightGrams?.message}
                placeholder="750"
              />
            </div>

            <Input
              label="Dimensions (JSON)"
              {...register(`variants.${variantIndex}.dimensions`)}
              error={errors.variants?.[variantIndex]?.dimensions?.message}
              placeholder='{"height": 60, "width": 30}'
              helperText="JSON format for dimensions"
            />

            {/* Pricing Section */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Pricing</h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Input
                  label="MRP"
                  type="number"
                  step="0.01"
                  {...register(`variants.${variantIndex}.pricing.mrp`, { valueAsNumber: true })}
                  error={errors.variants?.[variantIndex]?.pricing?.mrp?.message}
                  placeholder="649.00"
                />

                <Input
                  label="Selling Price"
                  type="number"
                  step="0.01"
                  {...register(`variants.${variantIndex}.pricing.sellingPrice`, { valueAsNumber: true })}
                  error={errors.variants?.[variantIndex]?.pricing?.sellingPrice?.message}
                  placeholder="599.00"
                />

                <Input
                  label="Discount %"
                  type="number"
                  {...register(`variants.${variantIndex}.pricing.discountPercent`, { valueAsNumber: true })}
                  error={errors.variants?.[variantIndex]?.pricing?.discountPercent?.message}
                  placeholder="8"
                />

                <Input
                  label="Start Date"
                  type="datetime-local"
                  {...register(`variants.${variantIndex}.pricing.startDatetime`)}
                  error={errors.variants?.[variantIndex]?.pricing?.startDatetime?.message}
                />

                <Input
                  label="End Date"
                  type="datetime-local"
                  {...register(`variants.${variantIndex}.pricing.endDatetime`)}
                  error={errors.variants?.[variantIndex]?.pricing?.endDatetime?.message}
                />

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    {...register(`variants.${variantIndex}.pricing.active`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Active Pricing</label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Images</h4>
                <Button
                  type="button"
                  onClick={() => addImageToVariant(variantIndex)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </div>

              {watchedVariants[variantIndex]?.images?.map((_, imageIndex) => {
                const mediaTypeError = errors.variants?.[variantIndex]?.images?.[imageIndex]?.mediaType?.message;
                const mediaTypeMessage = typeof mediaTypeError === 'string' ? mediaTypeError : undefined;

                return (
                  <div key={imageIndex} className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <Input
                      label="Media URL"
                      {...register(`variants.${variantIndex}.images.${imageIndex}.url`)}
                      error={errors.variants?.[variantIndex]?.images?.[imageIndex]?.url?.message}
                      placeholder="https://example.com/media.jpg"
                    />

                    <Input
                      label="Alt Text"
                      {...register(`variants.${variantIndex}.images.${imageIndex}.altText`)}
                      error={errors.variants?.[variantIndex]?.images?.[imageIndex]?.altText?.message}
                      placeholder="Plant in pot"
                    />

                    <Input
                      label="Sort Order"
                      type="number"
                      {...register(`variants.${variantIndex}.images.${imageIndex}.sortOrder`, { valueAsNumber: true })}
                      error={errors.variants?.[variantIndex]?.images?.[imageIndex]?.sortOrder?.message}
                      placeholder="1"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                      <select
                        {...register(`variants.${variantIndex}.images.${imageIndex}.mediaType`)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>
                      </select>
                      {mediaTypeMessage && (
                        <p className="mt-1 text-sm text-red-600">{mediaTypeMessage}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6 sm:col-span-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`variants.${variantIndex}.images.${imageIndex}.primary`)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">Primary</label>
                      </div>

                      {watchedVariants[variantIndex]?.images?.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeImageFromVariant(variantIndex, imageIndex)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="sm:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Input
                        label="Width (Optional)"
                        type="number"
                        {...register(`variants.${variantIndex}.images.${imageIndex}.metadata.width`)}
                        placeholder="1200"
                      />
                      <Input
                        label="Height (Optional)"
                        type="number"
                        {...register(`variants.${variantIndex}.images.${imageIndex}.metadata.height`)}
                        placeholder="1600"
                      />
                      <Input
                        label="Focal Point (Optional)"
                        {...register(`variants.${variantIndex}.images.${imageIndex}.metadata.focalPoint`)}
                        placeholder="center"
                      />
                      <Input
                        label="Duration (seconds) (Optional)"
                        type="number"
                        {...register(`variants.${variantIndex}.images.${imageIndex}.metadata.durationSeconds`)}
                        placeholder="48"
                      />
                      <Input
                        label="Thumbnail URL (Optional)"
                        {...register(`variants.${variantIndex}.images.${imageIndex}.metadata.thumbnailUrl`)}
                        placeholder="https://example.com/thumbnail.jpg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};
