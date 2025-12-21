import React, { useState } from 'react';
import { Users as UsersIcon, Search, Filter, X, Edit2, CheckCircle, XCircle, ArrowUpDown, UserPlus } from 'lucide-react';
import { useCustomerSearch, useUpdateCustomer, useOnboardUser } from '../hooks/useCustomers';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CustomerSearchItem, UserRole } from '../types/api';

export const Users: React.FC = () => {
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    role: undefined as UserRole | undefined,
    isActive: undefined as boolean | undefined,
    sortField: 'NAME' as 'NAME' | 'EMAIL' | 'PHONE' | 'CREATED_AT',
    sortDirection: 'ASC' as 'ASC' | 'DESC',
    limit: 50,
    offset: 0,
  });

  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomerSearchItem | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Build search request
  const searchRequest = React.useMemo(() => ({
    name: filters.name || undefined,
    email: filters.email || undefined,
    phone: filters.phone || undefined,
    role: filters.role,
    isActive: filters.isActive,
    limit: filters.limit,
    offset: filters.offset,
    sort: {
      field: filters.sortField,
      direction: filters.sortDirection,
    },
  }), [filters]);

  const { data: searchData, isLoading } = useCustomerSearch(searchRequest);
  const onboardUserMutation = useOnboardUser();
  const updateCustomerMutation = useUpdateCustomer();

  const users = searchData?.items || [];
  const totalUsers = searchData?.total || 0;

  const handleOnboardUser = async (data: { name: string; email: string; phone: string; roles: UserRole[] }) => {
    setOnboardError(null);
    try {
      const result = await onboardUserMutation.mutateAsync(data);
      console.log('User onboarded successfully:', result);
      setIsOnboardModalOpen(false);
    } catch (error: any) {
      setOnboardError(error.response?.data?.message || error.message || 'Failed to onboard user');
    }
  };

  const handleEditUser = (user: CustomerSearchItem) => {
    setEditingUser(user);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (data: { email?: string; roles: UserRole[]; isActive: boolean }) => {
    if (!editingUser) return;

    try {
      await updateCustomerMutation.mutateAsync({
        customerId: editingUser.customerId,
        data,
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditError(null);
    } catch (error: any) {
      setEditError(error.message || 'Failed to update user');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      email: '',
      phone: '',
      role: undefined,
      isActive: undefined,
      sortField: 'NAME',
      sortDirection: 'ASC',
      limit: 50,
      offset: 0,
    });
  };

  const hasActiveFilters = !!(filters.name || filters.email || filters.phone || filters.role || filters.isActive !== undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <Button onClick={() => setIsOnboardModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filter Panel */}
      <UserFilterPanel
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalUsers={totalUsers}
      />

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 mt-6 bg-white shadow rounded-lg">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters ? 'No users match your search criteria.' : 'No users available.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.customerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">ID: {user.customerId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      {user.phone}
                      {user.phoneVerified && (
                        <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            role === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : role === 'PRODUCT'
                              ? 'bg-blue-100 text-blue-800'
                              : role === 'INVENTORY'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboard User Modal */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => {
          setIsOnboardModalOpen(false);
          setOnboardError(null);
        }}
        title="Add New User"
      >
        <OnboardUserForm
          onSubmit={handleOnboardUser}
          onCancel={() => {
            setIsOnboardModalOpen(false);
            setOnboardError(null);
          }}
          error={onboardError}
          isLoading={onboardUserMutation.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
            setEditError(null);
          }}
          title="Edit User"
        >
          <EditUserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingUser(null);
              setEditError(null);
            }}
            error={editError}
            isLoading={updateCustomerMutation.isPending}
          />
        </Modal>
      )}
    </div>
  );
};

// User Filter Panel Component
interface UserFilterPanelProps {
  filters: {
    name: string;
    email: string;
    phone: string;
    role: UserRole | undefined;
    isActive: boolean | undefined;
    sortField: 'NAME' | 'EMAIL' | 'PHONE' | 'CREATED_AT';
    sortDirection: 'ASC' | 'DESC';
    limit: number;
    offset: number;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalUsers: number;
}

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  totalUsers,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSortChange = (field: typeof filters.sortField) => {
    const newDirection = filters.sortField === field && filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    onFilterChange({ ...filters, sortField: field, sortDirection: newDirection, offset: 0 });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Search Bar - Always Visible */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.name}
              onChange={(e) => onFilterChange({ ...filters, name: e.target.value, offset: 0 })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <input
            type="text"
            placeholder="Search by email..."
            value={filters.email}
            onChange={(e) => onFilterChange({ ...filters, email: e.target.value, offset: 0 })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <input
            type="text"
            placeholder="Search by phone..."
            value={filters.phone}
            onChange={(e) => onFilterChange({ ...filters, phone: e.target.value, offset: 0 })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{totalUsers} users found</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={filters.role || ''}
                onChange={(e) => onFilterChange({ ...filters, role: e.target.value || undefined, offset: 0 })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="PRODUCT">Product</option>
                <option value="INVENTORY">Inventory</option>
                <option value="CUSTOMER">Customer</option>
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

            {/* Sort Options */}
            <div>
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
                  onClick={() => handleSortChange('EMAIL')}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    filters.sortField === 'EMAIL'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    {filters.sortField === 'EMAIL' && (
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Current: {filters.sortField} ({filters.sortDirection})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit User Form Component
interface EditUserFormProps {
  user: CustomerSearchItem;
  onSubmit: (data: { email?: string; roles: UserRole[]; isActive: boolean }) => void;
  onCancel: () => void;
  error: string | null;
  isLoading: boolean;
}

const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  error,
  isLoading,
}) => {
  const [email, setEmail] = useState(user.email || '');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(user.roles);
  const [isActive, setIsActive] = useState(user.isActive);

  const availableRoles: UserRole[] = ['ADMIN', 'PRODUCT', 'INVENTORY', 'CUSTOMER'];

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email: email || undefined,
      roles: selectedRoles,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">User Information</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>ID:</strong> {user.customerId}</p>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="user@example.com"
        />
      </div>

      {/* Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roles
        </label>
        <div className="space-y-2">
          {availableRoles.map((role) => (
            <label key={role} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{role}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || selectedRoles.length === 0}>
          {isLoading ? 'Updating...' : 'Update User'}
        </Button>
      </div>
    </form>
  );
};

// Onboard User Form Component
interface OnboardUserFormProps {
  onSubmit: (data: { name: string; email: string; phone: string; roles: UserRole[] }) => void;
  onCancel: () => void;
  error: string | null;
  isLoading: boolean;
}

const OnboardUserForm: React.FC<OnboardUserFormProps> = ({
  onSubmit,
  onCancel,
  error,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  const availableRoles: UserRole[] = ['ADMIN', 'PRODUCT', 'INVENTORY'];

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email,
      phone,
      roles: selectedRoles,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> User will be created with the provided details. Admin can assign roles and manage permissions.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="John Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="john@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="+91-90000-12345"
        />
        <p className="mt-1 text-xs text-gray-500">
          User's contact number
        </p>
      </div>

      {/* Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roles <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {availableRoles.map((role) => (
            <label key={role} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{role}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select at least one role
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || selectedRoles.length === 0 || !name || !email || !phone}>
          {isLoading ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};
