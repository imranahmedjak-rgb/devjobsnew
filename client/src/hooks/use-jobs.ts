import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api, type JobFilter } from "@shared/routes";
import { Job } from "@shared/schema";

function buildQueryString(params: Record<string, any>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export interface PaginatedJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useJobs(filters: JobFilter) {
  const baseQueryString = buildQueryString(filters);
  const queryKey = [api.jobs.list.path, baseQueryString];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams(baseQueryString);
      params.set('page', String(pageParam));
      params.set('limit', '30');
      params.set('_t', String(Date.now())); // Cache buster
      const url = `${api.jobs.list.path}?${params.toString()}`;
      const res = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return await res.json() as PaginatedJobsResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: [api.jobs.stats.path],
    queryFn: async () => {
      const url = `${api.jobs.stats.path}?_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.jobs.stats.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = api.jobs.get.path.replace(":id", String(id));
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job details");
      return api.jobs.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useSyncJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.jobs.sync.path, {
        method: api.jobs.sync.method,
      });
      if (!res.ok) throw new Error("Failed to sync jobs");
      return api.jobs.sync.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}
