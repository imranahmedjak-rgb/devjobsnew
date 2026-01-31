import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useJobs(filters: JobFilter) {
  const queryString = buildQueryString(filters);
  const queryKey = [api.jobs.list.path, queryString];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.jobs.list.path}?${queryString}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: [api.jobs.stats.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.stats.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.jobs.stats.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      // Manual URL construction since we don't have a buildUrl helper in context
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
