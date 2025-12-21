import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../../types/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  parentId: z.number().nullable().optional(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      parentId: category?.parentId || null,
      sortOrder: category?.sortOrder || 10,
      active: category?.active ?? true,
    },
  });

  const watchName = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [watchName, isEditing, setValue]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
    if (!isEditing) {
      reset();
    }
  };

  // Filter out current category from parent options to prevent self-reference
  const parentOptions = categories.filter(cat => cat.categoryId !== category?.categoryId);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
              <h3 className="text-sm font-medium text-red-800">
                Error {category ? 'updating' : 'creating'} category
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g., Indoor Plants"
        />

        <Input
          label="Slug"
          {...register('slug')}
          error={errors.slug?.message}
          placeholder="e.g., indoor-plants"
          helperText="URL-friendly identifier (lowercase, hyphens only)"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
            Parent Category
          </label>
          <select
            {...register('parentId', { 
              setValueAs: (value) => value === '' ? null : parseInt(value) 
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">No Parent (Top Level)</option>
            {parentOptions.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.parentId && (
            <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
          )}
        </div>

        <Input
          label="Sort Order"
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
          error={errors.sortOrder?.message}
          placeholder="10"
          helperText="Lower numbers appear first"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('active')}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};
