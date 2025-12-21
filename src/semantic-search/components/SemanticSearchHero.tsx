import React from 'react';
import { POPULAR_SEARCHES, TRENDING_PRODUCTS } from '../constants';
import { useDebouncedCallback, useSemanticAutocomplete } from '../hooks';

interface SemanticSearchHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectSuggestion: (value: string) => void;
}

export const SemanticSearchHero: React.FC<SemanticSearchHeroProps> = ({
  query,
  onQueryChange,
  onSelectSuggestion,
}) => {
  const [inputValue, setInputValue] = React.useState(query);
  const [panelOpen, setPanelOpen] = React.useState(false);

  const debouncedUpdate = useDebouncedCallback((value: string) => {
    onQueryChange(value);
  }, 250);

  React.useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    debouncedUpdate(value);
  };

  const { data: suggestions } = useSemanticAutocomplete(inputValue, 8, panelOpen);

  return (
    <div className="semantic-hero">
      <div className="semantic-hero__search">
        <span className="semantic-hero__icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setPanelOpen(true)}
          onBlur={() => setTimeout(() => setPanelOpen(false), 150)}
          placeholder="Search products, styles, or moods..."
          className="semantic-hero__input"
        />
      </div>

      {panelOpen && (
        <div className="semantic-hero__panel">
          <div className="semantic-hero__panel-left">
            <h4>Popular Searches</h4>
            <ul>
              {POPULAR_SEARCHES.map((term) => (
                <li key={term}>
                  <button type="button" onMouseDown={() => onSelectSuggestion(term)}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="semantic-hero__panel-right">
            <h4>Trending Products</h4>
            <div className="semantic-hero__trending-grid">
              {suggestions?.suggestions?.length
                ? suggestions.suggestions.slice(0, 4).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="semantic-hero__trending-card"
                      onMouseDown={() => onSelectSuggestion(item.text)}
                    >
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt={item.primaryImageAlt || item.text} />
                      ) : (
                        <div className="semantic-hero__trending-placeholder" />
                      )}
                      <span>{item.text}</span>
                    </button>
                  ))
                : TRENDING_PRODUCTS.map((product) => (
                    <div key={product.id} className="semantic-hero__trending-card">
                      {product.mediaUrl ? (
                        <img src={product.mediaUrl} alt={product.mediaAlt || product.title} />
                      ) : (
                        <div className="semantic-hero__trending-placeholder" />
                      )}
                      <span>{product.title}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
