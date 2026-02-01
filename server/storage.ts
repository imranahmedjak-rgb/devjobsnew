
import { db } from "./db";
import { 
  jobs, type InsertJob, type Job, type JobFilter,
  users, type InsertUser, type User,
  recruiterProfiles, type InsertRecruiterProfile, type RecruiterProfile,
  jobSeekerProfiles, type InsertJobSeekerProfile, type JobSeekerProfile,
  directJobs, type InsertDirectJob, type DirectJob
} from "@shared/schema";
import { eq, ilike, and, desc, or, sql, count, countDistinct } from "drizzle-orm";

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface IStorage {
  // Jobs (API imported)
  getJobs(filters?: JobFilter, page?: number, limit?: number): Promise<PaginatedJobs>;
  getJob(id: number): Promise<Job | undefined>;
  getJobByExternalId(externalId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  createJobsBatch(jobsToInsert: InsertJob[]): Promise<Job[]>;
  getJobStats(): Promise<{ totalJobs: number; countriesCount: number; sourcesCount: number; lastUpdated: string }>;
  
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUserVerification(userId: number, verified: boolean): Promise<void>;
  setVerificationToken(userId: number, token: string): Promise<void>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  
  // Recruiter Profiles
  createRecruiterProfile(profile: InsertRecruiterProfile): Promise<RecruiterProfile>;
  getRecruiterProfile(userId: number): Promise<RecruiterProfile | undefined>;
  updateRecruiterProfile(userId: number, profile: Partial<InsertRecruiterProfile>): Promise<RecruiterProfile | undefined>;
  
  // Job Seeker Profiles
  createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile>;
  getJobSeekerProfile(userId: number): Promise<JobSeekerProfile | undefined>;
  updateJobSeekerProfile(userId: number, profile: Partial<InsertJobSeekerProfile>): Promise<JobSeekerProfile | undefined>;
  
  // Direct Jobs
  createDirectJob(job: InsertDirectJob): Promise<DirectJob>;
  getDirectJobs(page?: number, limit?: number): Promise<{ jobs: DirectJob[]; total: number }>;
  getDirectJob(id: number): Promise<DirectJob | undefined>;
  getDirectJobsByRecruiter(recruiterId: number): Promise<DirectJob[]>;
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
    const [directJobsResult] = await db.select({ count: count() }).from(directJobs);
    const [sourcesResult] = await db.select({ count: countDistinct(jobs.source) }).from(jobs);
    const [locationResult] = await db.select({ count: countDistinct(jobs.location) }).from(jobs);
    const [latestJob] = await db.select({ createdAt: jobs.createdAt }).from(jobs).orderBy(desc(jobs.createdAt)).limit(1);
    const [latestDirectJob] = await db.select({ postedAt: directJobs.postedAt }).from(directJobs).orderBy(desc(directJobs.postedAt)).limit(1);
    
    const totalJobs = (totalResult?.count || 0) + (directJobsResult?.count || 0);
    const sourcesCount = (sourcesResult?.count || 0) + ((directJobsResult?.count || 0) > 0 ? 1 : 0);
    
    const latestDate = latestJob?.createdAt || new Date(0);
    const latestDirectDate = latestDirectJob?.postedAt || new Date(0);
    const lastUpdated = latestDate > latestDirectDate ? latestDate : latestDirectDate;
    
    return {
      totalJobs,
      countriesCount: Math.min(locationResult?.count || 0, 193),
      sourcesCount,
      lastUpdated: lastUpdated.toISOString(),
    };
  }

  async clearAllJobs(): Promise<void> {
    await db.delete(jobs);
    console.log('Cleared all jobs from database');
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserVerification(userId: number, verified: boolean): Promise<void> {
    await db.update(users).set({ emailVerified: verified, verificationToken: null }).where(eq(users.id, userId));
  }

  async setVerificationToken(userId: number, token: string): Promise<void> {
    await db.update(users).set({ verificationToken: token }).where(eq(users.id, userId));
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  // Recruiter Profile methods
  async createRecruiterProfile(profile: InsertRecruiterProfile): Promise<RecruiterProfile> {
    const [newProfile] = await db.insert(recruiterProfiles).values(profile).returning();
    return newProfile;
  }

  async getRecruiterProfile(userId: number): Promise<RecruiterProfile | undefined> {
    const [profile] = await db.select().from(recruiterProfiles).where(eq(recruiterProfiles.userId, userId));
    return profile;
  }

  async updateRecruiterProfile(userId: number, profile: Partial<InsertRecruiterProfile>): Promise<RecruiterProfile | undefined> {
    const [updated] = await db.update(recruiterProfiles).set(profile).where(eq(recruiterProfiles.userId, userId)).returning();
    return updated;
  }

  // Job Seeker Profile methods
  async createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<JobSeekerProfile> {
    const [newProfile] = await db.insert(jobSeekerProfiles).values(profile).returning();
    return newProfile;
  }

  async getJobSeekerProfile(userId: number): Promise<JobSeekerProfile | undefined> {
    const [profile] = await db.select().from(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, userId));
    return profile;
  }

  async updateJobSeekerProfile(userId: number, profile: Partial<InsertJobSeekerProfile>): Promise<JobSeekerProfile | undefined> {
    const [updated] = await db.update(jobSeekerProfiles).set(profile).where(eq(jobSeekerProfiles.userId, userId)).returning();
    return updated;
  }

  // Direct Job methods
  async createDirectJob(job: InsertDirectJob): Promise<DirectJob> {
    const [newJob] = await db.insert(directJobs).values(job).returning();
    return newJob;
  }

  async getDirectJobs(page: number = 1, limit: number = 30): Promise<{ jobs: DirectJob[]; total: number }> {
    const [countResult] = await db.select({ count: count() }).from(directJobs);
    const total = countResult?.count || 0;
    const offset = (page - 1) * limit;
    
    const jobsList = await db.select().from(directJobs).orderBy(desc(directJobs.postedAt)).limit(limit).offset(offset);
    return { jobs: jobsList, total };
  }

  async getDirectJob(id: number): Promise<DirectJob | undefined> {
    const [job] = await db.select().from(directJobs).where(eq(directJobs.id, id));
    return job;
  }

  async getDirectJobsByRecruiter(recruiterId: number): Promise<DirectJob[]> {
    return await db.select().from(directJobs).where(eq(directJobs.recruiterId, recruiterId)).orderBy(desc(directJobs.postedAt));
  }
}

export const storage = new DatabaseStorage();
