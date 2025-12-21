import React from 'react';
import { Package, Layers, Warehouse, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StatCard {
  name: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const Dashboard: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  const stats: StatCard[] = [
    {
      name: 'Total Products',
      value: '0',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Categories',
      value: '0',
      icon: Layers,
      color: 'bg-green-500',
    },
    {
      name: 'Warehouses',
      value: '0',
      icon: Warehouse,
      color: 'bg-purple-500',
    },
    {
      name: 'Stock Items',
      value: '0',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ];

  const filteredStats = stats.filter((stat) => {
    if (stat.name === 'Total Products' || stat.name === 'Categories') {
      return hasAnyRole(['ADMIN', 'PRODUCT']);
    }
    if (stat.name === 'Warehouses' || stat.name === 'Stock Items') {
      return hasAnyRole(['ADMIN', 'INVENTORY']);
    }
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.email}! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filteredStats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasAnyRole(['ADMIN', 'PRODUCT']) && (
            <>
              <QuickActionCard
                title="Add New Product"
                description="Create a new product with variants and pricing"
                href="/products/new"
                icon={Package}
              />
              <QuickActionCard
                title="Manage Categories"
                description="Organize your product catalog"
                href="/categories"
                icon={Layers}
              />
            </>
          )}
          
          {hasAnyRole(['ADMIN', 'INVENTORY']) && (
            <>
              <QuickActionCard
                title="Stock Adjustment"
                description="Update inventory levels"
                href="/inventory/adjustments"
                icon={BarChart3}
              />
              <QuickActionCard
                title="Add Warehouse"
                description="Set up a new storage location"
                href="/warehouses/new"
                icon={Warehouse}
              />
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">
              No recent activity to display. Start by adding products or managing inventory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  href, 
  icon: Icon 
}) => {
  return (
    <a
      href={href}
      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div>
        <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 group-hover:bg-primary-100">
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900">
          <span className="absolute inset-0" />
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
};
