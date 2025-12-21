import React from 'react';
import { CATEGORY_FILTERS, PRODUCT_TYPE_FILTERS, TAG_FILTERS } from '../constants';

export interface SemanticFiltersState {
  productTypes: Set<string>;
  categories: Set<string>;
  tags: Set<string>;
  inStockOnly: boolean;
  priceMin?: number;
  priceMax?: number;
}

interface SemanticFiltersPanelProps {
  state: SemanticFiltersState;
  onToggleProductType: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleTag: (value: string) => void;
  onToggleInStock: (checked: boolean) => void;
  onPriceMinChange: (value?: number) => void;
  onPriceMaxChange: (value?: number) => void;
  onReset: () => void;
}
 
export const SemanticFiltersPanel: React.FC<SemanticFiltersPanelProps> = ({
  state,
  onToggleProductType,
  onToggleCategory,
  onToggleTag,
  onToggleInStock,
  onPriceMinChange,
  onPriceMaxChange,
  onReset,
}) => {
  return (
    <aside className="semantic-filters">
      <div className="semantic-filters__header">
        <h3>Refine</h3>
        <button type="button" onClick={onReset}>
          Reset all
        </button>
      </div>

      <section className="semantic-filters__section">
        <h4>Product Type</h4>
        <ul>
          {PRODUCT_TYPE_FILTERS.map((filter) => (
            <li key={filter.value}>
              <label>
                <input
                  type="checkbox"
                  checked={state.productTypes.has(filter.value)}
                  onChange={() => onToggleProductType(filter.value)}
                />
                {filter.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="semantic-filters__section">
        <h4>Category</h4>
        <ul>
          {CATEGORY_FILTERS.map((filter) => (
            <li key={filter.value}>
              <label>
                <input
                  type="checkbox"
                  checked={state.categories.has(filter.value)}
                  onChange={() => onToggleCategory(filter.value)}
                />
                {filter.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="semantic-filters__section">
        <h4>Tags</h4>
        <ul>
          {TAG_FILTERS.map((filter) => (
            <li key={filter.value}>
              <label>
                <input
                  type="checkbox"
                  checked={state.tags.has(filter.value)}
                  onChange={() => onToggleTag(filter.value)}
                />
                {filter.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="semantic-filters__section">
        <h4>Inventory</h4>
        <label className="semantic-filters__toggle">
          <input
            type="checkbox"
            checked={state.inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
          />
          In stock only
        </label>
      </section>

      <section className="semantic-filters__section">
        <h4>Price</h4>
        <div className="semantic-filters__price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={state.priceMin ?? ''}
            onChange={(e) =>
              onPriceMinChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
          <span className="semantic-filters__separator">—</span>
          <input
            type="number"
            placeholder="Max"
            value={state.priceMax ?? ''}
            onChange={(e) =>
              onPriceMaxChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </div>
      </section>
    </aside>
  );
};
