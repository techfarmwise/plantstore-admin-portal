import React from 'react';
import { SemanticSearchHit } from '../types';

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface SemanticResultsGridProps {
  hits: SemanticSearchHit[];
  viewMode: 'grid' | 'list';
}

export const SemanticResultsGrid: React.FC<SemanticResultsGridProps> = ({ hits, viewMode }) => {
  if (hits.length === 0) {
    return (
      <div className="semantic-empty">
        <h3>No results found</h3>
        <p>Try broadening your search or clearing some filters.</p>
      </div>
    );
  }

  return (
    <div className={`semantic-results semantic-results--${viewMode}`}>
      {hits.map((hit) => {
        const image = hit.source.primaryImageUrl || hit.source.media?.find((m) => m.primary)?.url;
        return (
          <article key={hit.id} className="semantic-card">
            <div className="semantic-card__media">
              {image ? <img src={image} alt={hit.source.primaryImageAlt || hit.source.title} /> : <div className="semantic-card__placeholder" />}
              <div className="semantic-card__badge">Score {hit.score.toFixed(2)}</div>
            </div>
            <div className="semantic-card__body">
              <header>
                <h3>{hit.source.title}</h3>
                {typeof hit.source.price === 'number' && (
                  <span className="semantic-card__price">{priceFormatter.format(hit.source.price)}</span>
                )}
              </header>
              <p className="semantic-card__description">{hit.source.description || 'No description available.'}</p>
              <div className="semantic-card__footer">
                <div className="semantic-card__tags">
                  {hit.source.tags?.slice(0, 3).map((tag) => (
                    <span key={`${hit.id}-${tag}`} className="semantic-card__tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="semantic-card__actions">
                  <button type="button">View details</button>
                  <button type="button">Copy SKU</button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
