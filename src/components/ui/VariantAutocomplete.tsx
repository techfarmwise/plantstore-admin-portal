import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import { useVariantSearchLite } from '../../hooks/useVariants';
import { VariantSearchLiteItem } from '../../types/api';

interface VariantAutocompleteProps {
  value: VariantSearchLiteItem | null;
  onChange: (variant: VariantSearchLiteItem | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const VariantAutocomplete: React.FC<VariantAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search by product name or SKU...',
  error,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: searchData, isLoading } = useVariantSearchLite(
    { query, limit: 10 },
    isOpen && query.length > 0
  );

  const variants = searchData?.items || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [variants]);

  // Update query when value changes (for edit mode)
  useEffect(() => {
    if (value) {
      setQuery(value.displayName);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    
    // Clear selection if user modifies the input
    if (value && newQuery !== value.displayName) {
      onChange(null);
    }
  };

  const handleSelect = (variant: VariantSearchLiteItem) => {
    onChange(variant);
    setQuery(variant.displayName);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || variants.length === 0) {
      if (e.key === 'ArrowDown' && !isOpen) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % variants.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + variants.length) % variants.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (variants[highlightedIndex]) {
          handleSelect(variants[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Display value or query
  const displayValue = value ? value.displayName : query;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm sm:text-sm ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching variants...
            </div>
          ) : variants.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No variants found for "{query}"
            </div>
          ) : (
            variants.map((variant, index) => (
              <button
                key={variant.variantId}
                type="button"
                onClick={() => handleSelect(variant)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                } ${value?.variantId === variant.variantId ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {variant.displayName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      SKU: {variant.sku} • ID: {variant.variantId}
                    </div>
                  </div>
                  {value?.variantId === variant.variantId && (
                    <Check className="h-4 w-4 text-primary-600 ml-2 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
