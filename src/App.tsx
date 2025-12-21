import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Products } from './pages/Products';
import { Composites } from './pages/Composites';
import { Warehouses } from './pages/Warehouses';
import { Inventory } from './pages/Inventory';
import { Users } from './pages/Users';
import { ProductsSearch } from './pages/ProductsSearch';
import { SemanticSearchPage } from './semantic-search/SemanticSearchPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Product Management Routes */}
              <Route
                path="categories"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCT']}>
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCT']}>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="composites"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCT']}>
                    <Composites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products-search"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <ProductsSearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="semantic-search"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <SemanticSearchPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Inventory Management Routes */}
              <Route
                path="warehouses"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'INVENTORY']}>
                    <Warehouses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'INVENTORY']}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
