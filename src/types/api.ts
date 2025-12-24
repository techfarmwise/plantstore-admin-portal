// Authentication Types
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  userId: number;
  refreshToken: string;
}

export interface LogoutRequest {
  userId: number;
  refreshToken: string;
}

// Password Reset Types
export interface PasswordResetRequestPayload {
  phone: string;
}

export interface PasswordResetRequestResponse {
  resetToken: string;
  expiresInSeconds: number;
  otp?: string; // Only in dev/test environments
}

export interface PasswordResetVerifyPayload {
  resetToken: string;
  otp: string;
}

export interface PasswordResetVerifyResponse {
  verificationToken: string;
  expiresInSeconds: number;
}

export interface PasswordResetConfirmPayload {
  verificationToken: string;
  newPassword: string;
  confirmPassword: string;
}

// User and Role Types
export type UserRole = 'ADMIN' | 'PRODUCT' | 'INVENTORY' | 'CUSTOMER';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface CustomerMeResponse {
  customerId: number;
  name: string;
  email: string | null;
  phone: string;
  phoneVerified: boolean;
  roles: UserRole[];
}

// Customer/User Management Types
export interface CustomerSearchRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sort?: {
    field: 'NAME' | 'EMAIL' | 'PHONE' | 'CREATED_AT';
    direction: 'ASC' | 'DESC';
  };
}

export interface CustomerSearchItem {
  customerId: number;
  userId?: number;
  name: string;
  email: string | null;
  phone: string;
  phoneVerified: boolean;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerSearchResponse {
  items: CustomerSearchItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CustomerUpdateRequest {
  email?: string;
  roles?: UserRole[];
  isActive?: boolean;
}

export interface CustomerOnboardRequest {
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
}

// Category Types
export interface Category {
  categoryId: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  parentId?: number | null;
  sortOrder: number;
  active: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
  active?: boolean;
}

// Product Types
export type ProductMediaType = 'IMAGE' | 'VIDEO';

export interface ProductImageMetadata {
  width?: number;
  height?: number;
  focalPoint?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ProductImage {
  url: string;
  altText: string;
  primary: boolean;
  sortOrder: number;
  mediaType: ProductMediaType;
  metadata?: ProductImageMetadata;
}

export interface ProductPricing {
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  startDatetime: string;
  endDatetime: string | null;
  active: boolean;
}

export interface ProductVariant {
  variantId?: number;
  sku: string;
  size: string;
  color: string;
  style: string | null;
  basePrice: number;
  weightGrams: number;
  dimensions: string;
  images: ProductImage[];
  pricing: ProductPricing;
}

export interface ProductCareInfo {
  water: string;
  light: string;
  temperature: string;
  difficulty: string;
  petFriendly: boolean;
  petWarning?: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface ProductBenefits {
  freeDeliveryThreshold?: number;
  replacementDays?: number;
  supportAvailable?: boolean;
}

export interface ProductDetailMetadata {
  careInfo?: ProductCareInfo;
  aboutProduct?: string;
  keyHighlights?: string[];
  faqs?: ProductFAQ[];
  benefits?: ProductBenefits;
}

export interface Product {
  productId?: number;
  name: string;
  categoryLabel: string;
  description: string;
  active: boolean;
  categoryIds: number[];
  variants: ProductVariant[];
  detailMetadata?: ProductDetailMetadata;
}

// Product Search Types
export interface ProductSearchRequest {
  categoryLabel?: string;
  categoryIds?: number[];
  skus?: string[];
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: {
    field: 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'VARIANT_COUNT';
    direction: 'ASC' | 'DESC';
  };
}

export interface ProductSearchItem {
  productId: number;
  name: string;
  categoryLabel: string;
  isActive: boolean;
  createdAt: string;
  variantCount: number;
  minPrice: number;
  maxPrice: number;
  categoryNames: string[];
  skus: string[];
}

export interface ProductSearchResponse {
  items: ProductSearchItem[];
  total: number;
  limit: number;
  offset: number;
}

// Product Search Engine Types
export type ProductSearchSortOption = 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULARITY' | 'NEWEST';

export interface ProductSearchEngineRequest {
  query?: string;
  categorySlugs?: string[];
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  productIds?: number[];
  variantIds?: number[];
  compositeIds?: number[];
  sort?: ProductSearchSortOption;
  page?: number;
  pageSize?: number;
  requireInStock?: boolean;
}

export interface ProductSearchEngineMediaItem {
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  altText?: string | null;
  primary: boolean;
  sortOrder: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ProductSearchEngineItem {
  documentId: number;
  productId: number | null;
  variantId: number | null;
  compositeId: number | null;
  title: string;
  description: string;
  price: number;
  active: boolean;
  inStock?: boolean;
  categoryPath: string[];
  tags: string[];
  attributes: Record<string, string | number | boolean | null>;
  media: ProductSearchEngineMediaItem[];
}

export interface ProductSearchEngineResponse {
  total: number;
  page: number;
  pageSize: number;
  elapsedMs: number;
  items: ProductSearchEngineItem[];
}

export type ProductSearchSuggestionResponse = string[];

export interface ProductCreateRequest extends Omit<Product, 'productId'> {}

export interface ProductUpdateRequest {
  productId: number;
  name?: string;
  description?: string;
  active?: boolean;
  categoryIds?: number[];
  detailMetadata?: ProductDetailMetadata;
  variants?: ProductVariant[];
  variantsToDelete?: number[];
}

export interface ProductResponse extends Product {
  productId: number;
  categories?: Category[]; // Categories with full details from individual product API
}

// Composite Product Types
export interface CompositeItem {
  variantId: number;
  quantityRequired: number;
}

export interface CompositeItemWithVariant {
  compositeItemId?: number;
  variant: {
    variantId: number;
    name: string;
    sku: string;
  };
  quantityRequired: number;
}

export interface CompositeDetailMetadata {
  aboutProduct?: string;
  keyHighlights?: string[];
  faqs?: ProductFAQ[];
  benefits?: ProductBenefits;
}

export interface CompositeProduct {
  compositeId?: number;
  name: string;
  description: string;
  pricingMode: 'FIXED' | 'DYNAMIC';
  fixedPrice?: number;
  active: boolean;
  items: CompositeItem[];
  detailMetadata?: CompositeDetailMetadata;
}

export interface CompositeCreateRequest extends Omit<CompositeProduct, 'compositeId'> {}

export interface CompositeResponse {
  compositeId: number;
  name: string;
  description: string;
  pricingMode: 'FIXED' | 'DYNAMIC';
  fixedPrice?: number;
  active: boolean;
  items: CompositeItemWithVariant[];
  pricing?: any;
  detailMetadata?: CompositeDetailMetadata;
}

// Composite Search Types
export interface CompositeSearchRequest {
  name?: string;
  pricingMode?: 'FIXED' | 'DYNAMIC';
  isActive?: boolean;
  variantSkuQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: {
    field: 'NAME' | 'MIN_PRICE' | 'MAX_PRICE' | 'CREATED_AT' | 'ITEM_COUNT';
    direction: 'ASC' | 'DESC';
  };
}

export interface CompositeSearchVariant {
  variantId: number;
  name: string;
  sku: string;
}

export interface CompositeSearchItem {
  compositeId: number;
  name: string;
  description: string;
  pricingMode: string;
  fixedPrice: number | null;
  isActive: boolean;
  createdAt: string;
  itemCount: number;
  minPrice: number;
  maxPrice: number;
  variants: CompositeSearchVariant[];
}

export interface CompositeSearchResponse {
  items: CompositeSearchItem[];
  total: number;
  limit: number;
  offset: number;
}

// Variant Search Types
export interface VariantSearchLiteRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface VariantSearchLiteItem {
  variantId: number;
  displayName: string;
  sku: string;
}

export interface VariantSearchLiteResponse {
  items: VariantSearchLiteItem[];
  total: number;
  limit: number;
  offset: number;
}

// Warehouse Types
export interface Warehouse {
  warehouseId?: number;
  name: string;
  code: string;
  address: string;
}

export interface WarehouseCreateRequest extends Omit<Warehouse, 'warehouseId'> {}

export interface WarehouseResponse extends Warehouse {
  warehouseId: number;
}

// Stock Types
export interface Stock {
  variantId: number;
  warehouseId: number;
  quantityAvailable: number;
  quantityReserved: number;
}

// Adjustment Types
export interface AdjustmentReason {
  reasonId: number;
  code: string;
  description: string;
}

export interface StockAdjustment {
  adjustmentId?: number;
  variantId: number;
  warehouseId: number;
  quantityDelta: number;
  reasonId: number;
  comment?: string;
  createdBy: string;
  productItemId?: number;
  referenceType?: string;
  referenceId?: string;
  createdAt?: string;
}

export interface AdjustmentCreateRequest extends Omit<StockAdjustment, 'adjustmentId' | 'createdAt'> {}

export interface AdjustmentResponse extends StockAdjustment {
  adjustmentId: number;
  createdAt: string;
}

// Reservation Types
export interface Reservation {
  orderItemId: number;
  productItemId: number;
  variantId: number;
  warehouseId: number;
  quantity: number;
  referenceType: string;
  referenceId: string;
}

export interface ReservationReleaseRequest {
  orderItemId: number;
  referenceType: string;
  referenceId: string;
}

// Stock Search Types
export interface StockSearchRequest {
  warehouseId?: number;
  search?: string;
  variantIds?: number[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortField?: 'PRODUCT_NAME' | 'VARIANT_NAME' | 'SKU' | 'QUANTITY_AVAILABLE' | 'QUANTITY_TOTAL';
  sortDirection?: 'ASC' | 'DESC';
}

export interface StockSearchItem {
  productId: number;
  productName: string;
  tags: string[];
  variantId: number;
  variantName: string;
  sku: string;
  warehouseId: number;
  warehouseCode: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityTotal: number;
}

export interface StockSearchResponse {
  items: StockSearchItem[];
  total: number;
  limit: number;
  offset: number;
}

// Low Stock Types
export type StockStatus = 'CRITICAL' | 'WARNING' | 'OK';

export interface LowStockItem {
  inventoryId: number;
  itemType: 'PRODUCT_VARIANT' | 'COMPOSITE';
  
  // Product details (if product variant)
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  productCategory: string[] | null;
  
  // Variant details
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  
  // Composite details (if composite)
  compositeId: number | null;
  compositeName: string | null;
  compositeSku: string | null;
  compositeCategory: string[] | null;
  compositeItemId: number | null;
  compositeItemName: string | null;
  compositeItemSku: string | null;
  
  // Stock information
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minThreshold: number;
  stockDifference: number;
  stockStatus: StockStatus;
  isIgnored: boolean;
}

export interface LowStockResponse {
  total: number;
  criticalCount: number;
  warningCount: number;
  items: LowStockItem[];
}

export interface LowStockRequest {
  warehouseId: number;
  category?: string;
  includeIgnored?: boolean;
  sortBy?: 'qty_asc' | 'qty_desc' | 'threshold_diff';
  limit?: number;
  offset?: number;
}

// Stock Configuration Types (Unified API)
export interface UpdateStockConfigRequest {
  variantId: number;
  warehouseId: number;
  minStockThreshold?: number;
  ignore?: boolean;
}

export interface StockConfigResponse {
  variantId: number;
  warehouseId: number;
  minStockThreshold: number | null;
  ignore: boolean | null;
  message: string;
}

// API Error Types
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  details: any;
  path: string;
  traceId: string;
  spanId: string;
}

// Common API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Variant Search Lite Types
export interface VariantSearchLiteRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface VariantSearchLiteItem {
  variantId: number;
  displayName: string;
  sku: string;
}

export interface VariantSearchLiteResponse {
  items: VariantSearchLiteItem[];
  total: number;
  limit: number;
  offset: number;
}
