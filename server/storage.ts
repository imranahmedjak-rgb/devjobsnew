
import { db } from "./db";
import { jobs, type InsertJob, type Job, type JobFilter } from "@shared/schema";
import { eq, ilike, and, desc, or, sql, count, countDistinct } from "drizzle-orm";

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IStorage {
  getJobs(filters?: JobFilter, page?: number, limit?: number): Promise<PaginatedJobs>;
  getJob(id: number): Promise<Job | undefined>;
  getJobByExternalId(externalId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  createJobsBatch(jobsToInsert: InsertJob[]): Promise<Job[]>;
  getJobStats(): Promise<{ totalJobs: number; countriesCount: number; sourcesCount: number; lastUpdated: string }>;
}

export class DatabaseStorage implements IStorage {
  async getJobs(filters?: JobFilter, page: number = 1, limit: number = 30): Promise<PaginatedJobs> {
    const conditions = [];

    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(jobs.title, searchLower),
          ilike(jobs.company, searchLower),
          ilike(jobs.description, searchLower)
        )
      );
    }

    if (filters?.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
    }

    if (filters?.remote) {
      conditions.push(eq(jobs.remote, true));
    }

    if (filters?.category) {
      conditions.push(eq(jobs.category, filters.category));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(whereCondition);
    
    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    // Get paginated jobs
    const jobsList = await db
      .select()
      .from(jobs)
      .where(whereCondition)
      .orderBy(desc(jobs.postedAt))
      .limit(limit)
      .offset(offset);

    return {
      jobs: jobsList,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobByExternalId(externalId: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.externalId, externalId));
    return job;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).onConflictDoNothing({ target: jobs.externalId }).returning();
    return newJob; // Might be undefined if conflict, handled by caller or ignored
  }

  async createJobsBatch(jobsToInsert: InsertJob[]): Promise<Job[]> {
    if (jobsToInsert.length === 0) return [];
    
    return await db.insert(jobs).values(jobsToInsert)
      .onConflictDoNothing({ target: jobs.externalId })
      .returning();
  }

  async getJobStats(): Promise<{ totalJobs: number; countriesCount: number; sourcesCount: number; lastUpdated: string }> {
    const [totalResult] = await db.select({ count: count() }).from(jobs);
    const [sourcesResult] = await db.select({ count: countDistinct(jobs.source) }).from(jobs);
    const [locationResult] = await db.select({ count: countDistinct(jobs.location) }).from(jobs);
    const [latestJob] = await db.select({ createdAt: jobs.createdAt }).from(jobs).orderBy(desc(jobs.createdAt)).limit(1);
    
    return {
      totalJobs: totalResult?.count || 0,
      countriesCount: Math.min(locationResult?.count || 0, 193),
      sourcesCount: sourcesResult?.count || 0,
      lastUpdated: latestJob?.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();
