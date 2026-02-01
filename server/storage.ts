
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
  
  // Countries
  getUniqueCountries(): Promise<string[]>;
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

  async getUniqueCountries(): Promise<string[]> {
    // Get all unique locations from both jobs and direct jobs
    const apiJobLocations = await db.selectDistinct({ location: jobs.location }).from(jobs);
    const directJobLocations = await db.selectDistinct({ location: directJobs.location }).from(directJobs);
    
    const allLocations = [
      ...apiJobLocations.map(j => j.location),
      ...directJobLocations.map(j => j.location)
    ];
    
    // Country mapping for normalization
    const countryMappings: Record<string, string> = {
      'usa': 'United States',
      'us': 'United States',
      'u.s.': 'United States',
      'u.s.a.': 'United States',
      'united states of america': 'United States',
      'uk': 'United Kingdom',
      'u.k.': 'United Kingdom',
      'britain': 'United Kingdom',
      'great britain': 'United Kingdom',
      'england': 'United Kingdom',
      'uae': 'United Arab Emirates',
      'u.a.e.': 'United Arab Emirates',
      'ksa': 'Saudi Arabia',
      'drc': 'Democratic Republic of the Congo',
      'south korea': 'South Korea',
      'republic of korea': 'South Korea',
      'korea': 'South Korea',
    };
    
    // Common country names to detect
    const knownCountries = [
      'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
      'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
      'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
      'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
      'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Czechia',
      'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
      'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
      'Fiji', 'Finland', 'France',
      'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
      'Haiti', 'Honduras', 'Hong Kong', 'Hungary',
      'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
      'Jamaica', 'Japan', 'Jordan',
      'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
      'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
      'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco',
      'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
      'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
      'Oman',
      'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
      'Qatar',
      'Romania', 'Russia', 'Rwanda',
      'Saint Kitts and Nevis', 'Saint Lucia', 'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
      'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
      'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
      'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
      'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
      'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
      'Yemen',
      'Zambia', 'Zimbabwe',
      // Special locations
      'Remote', 'Worldwide', 'Global', 'Multiple Locations'
    ];
    
    const extractedCountries = new Set<string>();
    
    for (const location of allLocations) {
      if (!location) continue;
      
      const locationLower = location.toLowerCase().trim();
      
      // Check mappings first
      for (const [abbrev, fullName] of Object.entries(countryMappings)) {
        if (locationLower.includes(abbrev)) {
          extractedCountries.add(fullName);
          break;
        }
      }
      
      // Check for known countries
      for (const country of knownCountries) {
        if (locationLower.includes(country.toLowerCase())) {
          extractedCountries.add(country);
        }
      }
      
      // If location has comma, last part might be country
      const parts = location.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const potentialCountry = parts[parts.length - 1];
        const potentialCountryLower = potentialCountry.toLowerCase();
        
        // Check if it matches a known country
        for (const country of knownCountries) {
          if (potentialCountryLower === country.toLowerCase()) {
            extractedCountries.add(country);
          }
        }
        
        // Check mappings
        if (countryMappings[potentialCountryLower]) {
          extractedCountries.add(countryMappings[potentialCountryLower]);
        }
      }
    }
    
    // Sort alphabetically, but put Remote/Worldwide/Global at the end
    const specialLocations = ['Remote', 'Worldwide', 'Global', 'Multiple Locations'];
    const regularCountries = Array.from(extractedCountries)
      .filter(c => !specialLocations.includes(c))
      .sort((a, b) => a.localeCompare(b));
    const special = Array.from(extractedCountries)
      .filter(c => specialLocations.includes(c))
      .sort((a, b) => a.localeCompare(b));
    
    return [...regularCountries, ...special];
  }
}

export const storage = new DatabaseStorage();
