import React, { useState } from 'react';
import { Plus, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import { useWarehouses, useCreateWarehouse } from '../hooks/useWarehouses';
import { WarehouseCreateRequest } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export const Warehouses: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: warehouses = [], isLoading, error } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  const handleCreateWarehouse = async (data: WarehouseFormData) => {
    setCreateError(null); // Clear previous errors
    
    try {
      await createWarehouseMutation.mutateAsync(data as WarehouseCreateRequest);
      setIsCreateModalOpen(false);
      setCreateError(null);
      reset();
    } catch (error: any) {
      console.error('Failed to create warehouse:', error);
      
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
        <p className="text-red-600">Failed to load warehouses. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your storage locations and distribution centers.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="text-center py-12">
          <WarehouseIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first warehouse location.
          </p>
          <div className="mt-6">
            <Button onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.warehouseId}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600">
                  <WarehouseIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {warehouse.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {warehouse.code}
                </p>
                <div className="mt-2 flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{warehouse.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }}
        title="Create New Warehouse"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreateWarehouse)} className="space-y-6">
          {/* Error Display */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error creating warehouse
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{createError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Warehouse Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Mumbai Distribution Center"
            />

            <Input
              label="Warehouse Code"
              {...register('code')}
              error={errors.code?.message}
              placeholder="e.g., MUM-01"
              helperText="Unique identifier for this warehouse"
            />
          </div>

          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
            placeholder="Full warehouse address"
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateError(null);
              }}
              disabled={createWarehouseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createWarehouseMutation.isPending}
              disabled={createWarehouseMutation.isPending}
            >
              Create Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
