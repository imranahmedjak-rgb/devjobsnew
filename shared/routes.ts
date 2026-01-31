
import { z } from "zod";
import { insertJobSchema, jobs, jobCategories } from "./schema";

export type JobFilter = {
  search?: string;
  location?: string;
  remote?: boolean;
  category?: "development" | "international";
};

export const api = {
  jobs: {
    list: {
      method: "GET" as const,
      path: "/api/jobs",
      input: z.object({
        search: z.string().optional(),
        location: z.string().optional(),
        remote: z.preprocess((val) => val === 'true', z.boolean()).optional(),
        category: z.enum(jobCategories).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/jobs/:id",
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/jobs",
      input: insertJobSchema,
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    sync: {
      method: "POST" as const,
      path: "/api/jobs/sync",
      responses: {
        200: z.object({ message: z.string(), count: z.number() }),
      },
    },
    stats: {
      method: "GET" as const,
      path: "/api/jobs/stats",
      responses: {
        200: z.object({
          totalJobs: z.number(),
          countriesCount: z.number(),
          sourcesCount: z.number(),
          lastUpdated: z.string(),
        }),
      },
    },
  },
};
