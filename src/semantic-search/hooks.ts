import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { semanticSearchApi } from './service';
import {
  SemanticSearchRequest,
  SemanticSearchResponse,
  SemanticAutocompleteResponse,
} from './types';

const SEMANTIC_SEARCH_QUERY_KEY = 'semantic-search';
const SEMANTIC_AUTOCOMPLETE_QUERY_KEY = 'semantic-search-autocomplete';

export const useSemanticSearch = (request: SemanticSearchRequest, enabled = true) => {
  return useQuery<SemanticSearchResponse>({
    queryKey: [SEMANTIC_SEARCH_QUERY_KEY, request],
    queryFn: () => semanticSearchApi.search(request),
    enabled,
  });
};

export const useSemanticAutocomplete = (query: string, size = 8, enabled = true) => {
  const trimmed = query.trim();
  return useQuery<SemanticAutocompleteResponse>({
    queryKey: [SEMANTIC_AUTOCOMPLETE_QUERY_KEY, trimmed, size],
    queryFn: () => semanticSearchApi.autocomplete(trimmed, size),
    enabled: enabled && trimmed.length > 0,
    staleTime: 60 * 1000,
  });
};

export const useDebouncedCallback = <T extends (...args: any[]) => void>(callback: T, delay = 200) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  function debouncedFunction(this: unknown, ...args: Parameters<T>) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current.apply(this, args);
    }, delay);
  }

  return debouncedFunction as T;
};
