
import { db } from "./db";
import { jobs, type InsertJob, type Job, type JobFilter } from "@shared/schema";
import { eq, ilike, and, desc, or, sql } from "drizzle-orm";

export interface IStorage {
  getJobs(filters?: JobFilter): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobByExternalId(externalId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  createJobsBatch(jobsToInsert: InsertJob[]): Promise<Job[]>;
}

export class DatabaseStorage implements IStorage {
  async getJobs(filters?: JobFilter): Promise<Job[]> {
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

    return await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.postedAt));
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
    
    // Drizzle doesn't support ON CONFLICT DO NOTHING with returning easily in all drivers/versions in one go nicely without raw sql sometimes, 
    // but standard insert ... on conflict do nothing works.
    // We'll insert one by one or small batch for safety, or just standard batch.
    
    return await db.insert(jobs).values(jobsToInsert)
      .onConflictDoNothing({ target: jobs.externalId })
      .returning();
  }
}

export const storage = new DatabaseStorage();
