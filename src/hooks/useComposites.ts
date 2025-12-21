import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compositeService } from '../services/composites';
import { CompositeCreateRequest, CompositeResponse, CompositeSearchRequest } from '../types/api';

export const COMPOSITES_QUERY_KEY = 'composites';
export const COMPOSITES_SEARCH_QUERY_KEY = 'compositesSearch';

export const useComposites = () => {
  return useQuery({
    queryKey: [COMPOSITES_QUERY_KEY],
    queryFn: async () => {
      const composites = await compositeService.getComposites();
      console.log('Composites API response:', composites);
      return composites;
    },
  });
};

export const useComposite = (compositeId: number | null) => {
  return useQuery({
    queryKey: [COMPOSITES_QUERY_KEY, compositeId],
    queryFn: () => compositeService.getComposite(compositeId as number),
    enabled: !!compositeId,
  });
};

export const useCompositeSearch = (request: CompositeSearchRequest, enabled: boolean = true) => {
  return useQuery({
    queryKey: [COMPOSITES_SEARCH_QUERY_KEY, request],
    queryFn: () => compositeService.searchComposites(request),
    enabled,
  });
};

export const useCreateComposite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompositeCreateRequest) => compositeService.createComposite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_SEARCH_QUERY_KEY] });
    },
  });
};

export const useUpdateComposite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ compositeId, data }: { compositeId: number; data: CompositeCreateRequest }) =>
      compositeService.updateComposite(compositeId, data),
    onSuccess: (_, { compositeId }) => {
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_SEARCH_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_QUERY_KEY, compositeId] });
    },
  });
};

export const useDeleteComposite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (compositeId: number) => compositeService.deleteComposite(compositeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPOSITES_SEARCH_QUERY_KEY] });
    },
  });
};
