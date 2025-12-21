import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import { Category, CategoryUpdateRequest } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CategoryForm } from '../components/categories/CategoryForm';

type CategoryFormData = {
  name: string;
  slug: string;
  parentId?: number | null;
  sortOrder: number;
  active: boolean;
};

type CategoryWithChildren = Category & { children: CategoryWithChildren[] };

export const Categories: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: categories = [], isLoading, error } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleCreateCategory = async (data: CategoryFormData) => {
    setCreateError(null); // Clear previous errors
    
    try {
      await createCategoryMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
      setCreateError(null);
    } catch (error: any) {
      console.error('Failed to create category:', error);
      
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

  const handleUpdateCategory = async (data: CategoryUpdateRequest) => {
    if (!editingCategory) return;
    
    setUpdateError(null); // Clear previous errors
    
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.categoryId,
        data,
      });
      setEditingCategory(null);
      setUpdateError(null);
    } catch (error: any) {
      console.error('Failed to update category:', error);
      
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

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setDeleteError(null); // Clear previous errors

    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory.categoryId);
      setDeletingCategory(null);
      setDeleteError(null);
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'An unexpected error occurred';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setDeleteError(errorMessage);
    }
  };

  // Build category hierarchy for display
  const buildCategoryTree = (categories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<number, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // Initialize all categories with children array
    categories.forEach(cat => {
      categoryMap.set(cat.categoryId, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.categoryId)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    // Sort by sortOrder
    const sortCategories = (cats: CategoryWithChildren[]) => {
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      cats.forEach(cat => sortCategories(cat.children));
    };

    sortCategories(rootCategories);
    return rootCategories;
  };

  const categoryTree = buildCategoryTree(categories);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load categories. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product categories and organize your catalog.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Sort Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {categoryTree.map((category) => (
                    <CategoryRow
                      key={category.categoryId}
                      category={category}
                      categories={categories}
                      onEdit={setEditingCategory}
                      onDelete={setDeletingCategory}
                      level={0}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Create New Category"
        size="lg"
      >
        <CategoryForm
          categories={categories}
          onSubmit={handleCreateCategory}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }}
          isLoading={createCategoryMutation.isPending}
          error={createError}
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => {
          setEditingCategory(null);
          setUpdateError(null);
        }}
        title="Edit Category"
        size="lg"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={handleUpdateCategory}
            onCancel={() => {
              setEditingCategory(null);
              setUpdateError(null);
            }}
            isLoading={updateCategoryMutation.isPending}
            error={updateError}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => {
          setDeletingCategory(null);
          setDeleteError(null);
        }}
        title="Delete Category"
      >
        {deletingCategory && (
          <div className="space-y-4">
            {/* Delete Error Display */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error deleting category
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{deleteError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Are you sure you want to delete the category "{deletingCategory.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeletingCategory(null);
                  setDeleteError(null);
                }}
                disabled={deleteCategoryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
                isLoading={deleteCategoryMutation.isPending}
              >
                Delete Category
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

interface CategoryRowProps {
  category: CategoryWithChildren;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  level: number;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  categories,
  onEdit,
  onDelete,
  level,
}) => {
  const parentCategory = categories.find(cat => cat.categoryId === category.parentId);
  const indent = level * 20;

  return (
    <>
      <tr>
        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
          <div style={{ paddingLeft: `${indent}px` }} className="flex items-center">
            {level > 0 && <span className="text-gray-400 mr-2">└─</span>}
            {category.name}
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {category.slug}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {parentCategory?.name || '—'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {category.sortOrder}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            category.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {category.active ? (
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
        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      {category.children.map((child: CategoryWithChildren) => (
        <CategoryRow
          key={child.categoryId}
          category={child}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level + 1}
        />
      ))}
    </>
  );
};
