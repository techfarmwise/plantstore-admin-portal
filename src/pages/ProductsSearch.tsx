import React from 'react';
import { Search, SlidersHorizontal, RefreshCw, Tag, Package2, Boxes, Sparkles, Video } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  ProductSearchEngineRequest,
  ProductSearchEngineItem,
  ProductSearchSortOption,
} from '../types/api';
import { useProductSearchEngine, useProductSearchSuggestions } from '../hooks/useProductSearchEngine';

const SORT_OPTIONS: { value: ProductSearchSortOption; label: string }[] = [
  { value: 'RELEVANCE', label: 'Relevance' },
  { value: 'PRICE_ASC', label: 'Price: Low to High' },
  { value: 'PRICE_DESC', label: 'Price: High to Low' },
  { value: 'POPULARITY', label: 'Popularity' },
  { value: 'NEWEST', label: 'Newest' },
];

const PAGE_SIZE_OPTIONS = [12, 20, 30, 40, 50];

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const buildRequest = (filters: FiltersState): ProductSearchEngineRequest => {
  const parseStringList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const parseNumberList = (value: string) =>
    parseStringList(value)
      .map((item) => Number(item))
      .filter((num) => !Number.isNaN(num));

  const request: ProductSearchEngineRequest = {
    query: filters.query || undefined,
    sort: filters.sort,
    page: Math.max(1, filters.page + 1),
    pageSize: Math.min(50, Math.max(1, filters.pageSize)),
    requireInStock: filters.requireInStock || undefined,
  };

  const categorySlugs = parseStringList(filters.categorySlugs);
  if (categorySlugs.length > 0) {
    request.categorySlugs = categorySlugs;
  }

  const tags = parseStringList(filters.tags);
  if (tags.length > 0) {
    request.tags = tags;
  }

  const productIds = parseNumberList(filters.productIds);
  if (productIds.length > 0) {
    request.productIds = productIds;
  }

  const variantIds = parseNumberList(filters.variantIds);
  if (variantIds.length > 0) {
    request.variantIds = variantIds;
  }

  const compositeIds = parseNumberList(filters.compositeIds);
  if (compositeIds.length > 0) {
    request.compositeIds = compositeIds;
  }

  if (filters.priceMin !== '') {
    const priceMin = Number(filters.priceMin);
    if (!Number.isNaN(priceMin)) {
      request.priceMin = priceMin;
    }
  }

  if (filters.priceMax !== '') {
    const priceMax = Number(filters.priceMax);
    if (!Number.isNaN(priceMax)) {
      request.priceMax = priceMax;
    }
  }

  return request;
};

export interface FiltersState {
  query: string;
  categorySlugs: string;
  tags: string;
  productIds: string;
  variantIds: string;
  compositeIds: string;
  priceMin: string;
  priceMax: string;
  requireInStock: boolean;
  sort: ProductSearchSortOption;
  page: number; // zero-based for API
  pageSize: number;
}

export const ProductsSearch: React.FC = () => {
  const [filters, setFilters] = React.useState<FiltersState>({
    query: '',
    categorySlugs: '',
    tags: '',
    productIds: '',
    variantIds: '',
    compositeIds: '',
    priceMin: '',
    priceMax: '',
    requireInStock: false,
    sort: 'RELEVANCE',
    page: 0,
    pageSize: 20,
  });

  const [request, setRequest] = React.useState<ProductSearchEngineRequest>({
    page: 0,
    pageSize: 20,
    sort: 'RELEVANCE',
  });

  const { data, isLoading, isError, error, isFetching } = useProductSearchEngine(request, true);
  const { data: suggestions } = useProductSearchSuggestions(filters.query, 8);

  const totalPages = React.useMemo(() => {
    if (!data || data.pageSize === 0) return 0;
    return Math.ceil(data.total / data.pageSize);
  }, [data]);

  const handleApplyFilters = React.useCallback(
    (overrides?: Partial<FiltersState>) => {
      const merged = { ...filters, ...overrides };
      if (merged.page < 0) merged.page = 0;
      setFilters(merged);
      setRequest(buildRequest(merged));
    },
    [filters]
  );

  const handleClearFilters = () => {
    const reset: FiltersState = {
      query: '',
      categorySlugs: '',
      tags: '',
      productIds: '',
      variantIds: '',
      compositeIds: '',
      priceMin: '',
      priceMax: '',
      requireInStock: false,
      sort: 'RELEVANCE',
      page: 0,
      pageSize: 20,
    };
    setFilters(reset);
    setRequest(buildRequest(reset));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!data) return;
    const currentPage = Math.max(0, filters.page);
    const newPage = direction === 'prev' ? Math.max(0, currentPage - 1) : currentPage + 1;
    if (direction === 'next' && totalPages > 0 && currentPage + 1 >= totalPages) return;
    handleApplyFilters({ page: newPage });
  };

  const items = data?.items ?? [];

  const activeFilters = React.useMemo(() => {
    const result: string[] = [];
    if (filters.query) result.push(`Query: "${filters.query}"`);
    if (filters.categorySlugs) result.push(`Categories: ${filters.categorySlugs}`);
    if (filters.tags) result.push(`Tags: ${filters.tags}`);
    if (filters.productIds) result.push(`Product IDs: ${filters.productIds}`);
    if (filters.variantIds) result.push(`Variant IDs: ${filters.variantIds}`);
    if (filters.compositeIds) result.push(`Composite IDs: ${filters.compositeIds}`);
    if (filters.priceMin) result.push(`Min Price: ₹${filters.priceMin}`);
    if (filters.priceMax) result.push(`Max Price: ₹${filters.priceMax}`);
    if (filters.requireInStock) result.push('Only In Stock');
    return result;
  }, [filters]);

  return (
    <div className="py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Product Search Explorer</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-3xl">
          Browse indexed storefront documents exactly as customers would see them. Use this admin-only view to
          validate new products, composites, pricing and tagging configuration. Searches mirror the
          <code className="px-1 py-0.5 mx-1 rounded bg-gray-100 text-xs">/product-search-engine/search</code> API.
        </p>
      </header>

      <section className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="relative">
          <label className="sr-only" htmlFor="searchQuery">Search products</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="searchQuery"
                type="text"
                value={filters.query}
                onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value, page: 0 }))}
                placeholder="Search by keyword, SKU or tag..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {suggestions && suggestions.length > 0 && filters.query.trim().length > 1 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion}
                      className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-primary-50"
                      onMouseDown={() => handleApplyFilters({ query: suggestion, page: 0 })}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Reset
              </Button>
              <Button type="button" onClick={() => handleApplyFilters({ page: 0 })}>
                {isFetching ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Refreshing
                  </span>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>
        </div>

        <details className="mt-4" open>
          <summary className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <SlidersHorizontal className="h-4 w-4" /> Advanced filters
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category slugs</label>
              <input
                type="text"
                value={filters.categorySlugs}
                onChange={(e) => setFilters((prev) => ({ ...prev, categorySlugs: e.target.value, page: 0 }))}
                placeholder="indoor, foliage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated slugs</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={filters.tags}
                onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value, page: 0 }))}
                placeholder="air-purifying, pet-friendly"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated tags</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product IDs</label>
              <input
                type="text"
                value={filters.productIds}
                onChange={(e) => setFilters((prev) => ({ ...prev, productIds: e.target.value, page: 0 }))}
                placeholder="101, 204"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variant IDs</label>
              <input
                type="text"
                value={filters.variantIds}
                onChange={(e) => setFilters((prev) => ({ ...prev, variantIds: e.target.value, page: 0 }))}
                placeholder="301, 302"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Composite IDs</label>
              <input
                type="text"
                value={filters.compositeIds}
                onChange={(e) => setFilters((prev) => ({ ...prev, compositeIds: e.target.value, page: 0 }))}
                placeholder="501"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min price</label>
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priceMin: e.target.value, page: 0 }))}
                  placeholder="499"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max price</label>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priceMax: e.target.value, page: 0 }))}
                  placeholder="2499"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="requireInStock"
                type="checkbox"
                checked={filters.requireInStock}
                onChange={(e) => setFilters((prev) => ({ ...prev, requireInStock: e.target.checked, page: 0 }))}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="requireInStock" className="text-sm text-gray-700">
                Require in-stock only
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={filters.sort}
                onChange={(e) => {
                  const value = e.target.value as ProductSearchSortOption;
                  setFilters((prev) => ({ ...prev, sort: value }));
                  handleApplyFilters({ sort: value, page: 0 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page size</label>
              <select
                value={filters.pageSize}
                onChange={(e) => {
                  const pageSize = Number(e.target.value);
                  setFilters((prev) => ({ ...prev, pageSize, page: 0 }));
                  handleApplyFilters({ pageSize, page: 0 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </details>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              'Loading results...'
            ) : data ? (
              <span>
                Showing{' '}
                <strong>{items.length}</strong> of <strong>{data.total}</strong> documents — page {data.page + 1} of{' '}
                {totalPages || 1}. <span className="text-gray-400">({data.elapsedMs} ms)</span>
              </span>
            ) : (
              'Run a search to see results.'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={filters.page <= 0 || isLoading}
              onClick={() => handlePageChange('prev')}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || (data ? data.page + 1 >= totalPages : true)}
              onClick={() => handlePageChange('next')}
            >
              Next
            </Button>
          </div>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
            Failed to load search results. {(error as any)?.message || 'Please try again.'}
          </div>
        )}

        <div
          className={cn(
            'grid gap-4',
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          )}
        >
          {isLoading
            ? Array.from({ length: filters.pageSize }).map((_, index) => (
                <div key={index} className="animate-pulse bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="bg-gray-200 rounded-lg h-40" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            : items.map((item) => <ResultCard key={item.documentId} item={item} />)}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No results</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your filters or searching for a different keyword.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

interface ResultCardProps {
  item: ProductSearchEngineItem;
}

const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
  const entityType = item.variantId
    ? 'Variant'
    : item.compositeId
    ? 'Composite'
    : item.productId
    ? 'Product'
    : 'Document';

  const identifier = item.variantId || item.compositeId || item.productId;
  const metaBadges = [
    { label: entityType, icon: entityType === 'Composite' ? Boxes : Package2 },
    ...(item.tags || []).slice(0, 3).map((tag) => ({ label: tag, icon: Tag })),
  ];

  const primaryMedia = item.media?.find((mediaItem) => mediaItem.primary) || item.media?.[0];
  const displayImage = primaryMedia?.mediaType === 'IMAGE'
    ? primaryMedia.url
    : primaryMedia?.metadata && typeof primaryMedia.metadata.thumbnailUrl === 'string'
      ? primaryMedia.metadata.thumbnailUrl
      : undefined;

  const videoDuration =
    primaryMedia?.mediaType === 'VIDEO' && typeof primaryMedia?.metadata?.durationSeconds === 'number'
      ? primaryMedia.metadata.durationSeconds
      : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <Package2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">No image</p>
          </div>
        )}
        <div className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
          #{item.documentId}
        </div>
        {identifier && (
          <div className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
            ID: {identifier}
          </div>
        )}
        {primaryMedia?.mediaType === 'VIDEO' && (
          <div className="absolute bottom-3 left-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
            <Video className="h-3.5 w-3.5 mr-1" />
            {videoDuration ? `${videoDuration}s` : 'Video'}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description || 'No description provided.'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {metaBadges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              <badge.icon className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {badge.label}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-lg font-semibold text-primary-700">
            {formatter.format(item.price)}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}
            >
              {item.active ? 'Active' : 'Inactive'}
            </span>
            {typeof item.inStock === 'boolean' && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  item.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                )}
              >
                {item.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            )}
          </div>
        </div>

        {item.categoryPath && item.categoryPath.length > 0 && (
          <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
            <span className="font-medium text-gray-600">Categories:</span>
            {item.categoryPath.join(' / ')}
          </div>
        )}

        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attributes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(item.attributes)
                .slice(0, 6)
                .map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-xs text-gray-600">
                    <span className="font-medium text-gray-700 mr-1">{key}:</span>
                    {String(value ?? '—')}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
