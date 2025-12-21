import React from 'react';
import { SemanticSearchHero } from './components/SemanticSearchHero';
import { SemanticFiltersPanel, SemanticFiltersState } from './components/SemanticFiltersPanel';
import { SemanticResultsGrid } from './components/SemanticResultsGrid';
import { useSemanticSearch } from './hooks';
import { SemanticSearchRequest } from './types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
import './semanticSearch.css';

const createInitialFilters = (): SemanticFiltersState => ({
  productTypes: new Set<string>(),
  categories: new Set<string>(),
  tags: new Set<string>(),
  inStockOnly: false,
  priceMin: undefined,
  priceMax: undefined,
});

const toggleSetValue = (set: Set<string>, value: string) => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

export const SemanticSearchPage: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState<SemanticFiltersState>(() => createInitialFilters());
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [request, setRequest] = React.useState<SemanticSearchRequest>({
    query: '',
    from: 0,
    size: DEFAULT_PAGE_SIZE,
  });

  const { data, isLoading, isError, error, isFetching } = useSemanticSearch(request, true);

  const hits = data?.hits ?? [];
  const total = data?.total ?? 0;

  const handleApplyFilters = React.useCallback(
    (overrides?: Partial<SemanticFiltersState>) => {
      setFilters((current) => {
        const next = { ...current, ...overrides };

        const filterPayload: SemanticSearchRequest['filters'] = {};
        if (next.productTypes.size > 0) {
          filterPayload['attributes.type'] = Array.from(next.productTypes);
        }
        if (next.categories.size > 0) {
          filterPayload.categoryPath = Array.from(next.categories);
        }
        if (next.tags.size > 0) {
          filterPayload.tags = Array.from(next.tags);
        }
        if (next.inStockOnly) {
          filterPayload.inStock = true;
        }
        if (next.priceMin !== undefined || next.priceMax !== undefined) {
          filterPayload.price = {
            gte: next.priceMin,
            lte: next.priceMax,
          };
        }

        setRequest((prev) => ({
          ...prev,
          query,
          from: 0,
          filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
        }));

        return next;
      });
    },
    [query]
  );

  const handleResetFilters = React.useCallback(() => {
    setFilters(createInitialFilters());
    setRequest((prev) => ({ ...prev, filters: undefined, from: 0 }));
  }, []);

  const handleLoadMore = () => {
    setRequest((prev) => ({
      ...prev,
      from: Math.max(0, (prev.from ?? 0) + (prev.size ?? DEFAULT_PAGE_SIZE)),
    }));
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setRequest((prev) => ({
      ...prev,
      query: value,
      from: 0,
    }));
  };

  const handleSelectSuggestion = (value: string) => {
    setQuery(value);
    setRequest((prev) => ({
      ...prev,
      query: value,
      from: 0,
    }));
  };

  const handlePageSizeChange = (size: number) => {
    const bounded = Math.min(MAX_PAGE_SIZE, Math.max(6, size));
    setRequest((prev) => ({
      ...prev,
      size: bounded,
      from: 0,
    }));
  };

  interface AppliedFilterChip {
    key: string;
    label: string;
    onRemove: () => void;
  }

  const appliedFilters = React.useMemo<AppliedFilterChip[]>(() => {
    const chips: AppliedFilterChip[] = [];

    filters.productTypes.forEach((value) => {
      chips.push({
        key: `type-${value}`,
        label: value,
        onRemove: () =>
          handleApplyFilters({
            productTypes: new Set(Array.from(filters.productTypes).filter((v) => v !== value)),
          }),
      });
    });

    filters.categories.forEach((value) => {
      chips.push({
        key: `category-${value}`,
        label: value,
        onRemove: () =>
          handleApplyFilters({
            categories: new Set(Array.from(filters.categories).filter((v) => v !== value)),
          }),
      });
    });

    filters.tags.forEach((value) => {
      chips.push({
        key: `tag-${value}`,
        label: value,
        onRemove: () =>
          handleApplyFilters({
            tags: new Set(Array.from(filters.tags).filter((v) => v !== value)),
          }),
      });
    });

    if (filters.inStockOnly) {
      chips.push({
        key: 'stock',
        label: 'In stock',
        onRemove: () => handleApplyFilters({ inStockOnly: false }),
      });
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const min = filters.priceMin !== undefined ? `≥ ₹${filters.priceMin}` : '';
      const max = filters.priceMax !== undefined ? `≤ ₹${filters.priceMax}` : '';
      chips.push({
        key: 'price',
        label: `Price ${[min, max].filter(Boolean).join(' ')}`.trim(),
        onRemove: () => handleApplyFilters({ priceMin: undefined, priceMax: undefined }),
      });
    }

    return chips;
  }, [filters, handleApplyFilters]);

  return (
    <div className="semantic-page">
      <header className="semantic-page__header">
        <div>
          <p className="semantic-page__breadcrumb">Catalog · Semantic Search</p>
          <h1>Product Discovery</h1>
        </div>
        <div className="semantic-page__actions">
          <button type="button" className="semantic-page__help">
            docs
          </button>
        </div>
      </header>

      <SemanticSearchHero
        query={query}
        onQueryChange={handleQueryChange}
        onSelectSuggestion={handleSelectSuggestion}
      />

      <div className="semantic-page__tabs">
        <button type="button" className="semantic-page__tab semantic-page__tab--active">
          Products ({total})
        </button>
        <button type="button" className="semantic-page__tab semantic-page__tab--disabled">
          Collections (soon)
        </button>
      </div>

      <div className="semantic-page__layout">
        <SemanticFiltersPanel
          state={filters}
          onToggleProductType={(value) =>
            handleApplyFilters({ productTypes: toggleSetValue(filters.productTypes, value) })
          }
          onToggleCategory={(value) =>
            handleApplyFilters({ categories: toggleSetValue(filters.categories, value) })
          }
          onToggleTag={(value) => handleApplyFilters({ tags: toggleSetValue(filters.tags, value) })}
          onToggleInStock={(checked) => handleApplyFilters({ inStockOnly: checked })}
          onPriceMinChange={(value) => handleApplyFilters({ priceMin: value })}
          onPriceMaxChange={(value) => handleApplyFilters({ priceMax: value })}
          onReset={handleResetFilters}
        />

        <main className="semantic-content">
          <div className="semantic-toolbar">
            <div>
              <p className="semantic-toolbar__caption">
                {isLoading ? 'Loading results…' : `${hits.length} of ${total} results`}
              </p>
            </div>
            <div className="semantic-toolbar__controls">
              <label>
                View as
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}>
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </label>
              <label>
                Page size
                <select value={request.size} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
                  {[12, 18, 24, 30, 40].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {appliedFilters.length > 0 && (
            <div className="semantic-chips">
              {appliedFilters.map((chip) => (
                <span key={chip.key} className="semantic-chip">
                  {chip.label}
                  <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {isError && (
            <div className="semantic-error">
              <h3>Unable to fetch results</h3>
              <p>{(error as Error)?.message ?? 'Check the semantic search service and try again.'}</p>
              <button type="button" onClick={() => setRequest((prev) => ({ ...prev }))}>
                Retry
              </button>
            </div>
          )}

          <SemanticResultsGrid hits={hits} viewMode={viewMode} />

          {total > (request.from ?? 0) + (request.size ?? DEFAULT_PAGE_SIZE) && (
            <div className="semantic-load-more">
              <button type="button" onClick={handleLoadMore} disabled={isFetching}>
                {isFetching ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
