import axios from 'axios';
import {
  SemanticSearchRequest,
  SemanticSearchResponse,
  SemanticAutocompleteResponse,
} from './types';

const BASE_URL = process.env.REACT_APP_SEMANTIC_SEARCH_BASE_URL || 'http://localhost:8000/api/v1';

export class SemanticSearchApi {
  async search(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    const payload: SemanticSearchRequest = {
      ...request,
      from: Math.max(0, request.from ?? 0),
      size: Math.min(50, Math.max(1, request.size ?? 12)),
    };

    const response = await axios.post<SemanticSearchResponse>(`${BASE_URL}/search`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async autocomplete(query: string, size = 10): Promise<SemanticAutocompleteResponse> {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('size', Math.min(50, Math.max(1, size)).toString());

    const response = await axios.get<SemanticAutocompleteResponse>(`${BASE_URL}/autocomplete?${params.toString()}`);
    return response.data;
  }
}

export const semanticSearchApi = new SemanticSearchApi();
