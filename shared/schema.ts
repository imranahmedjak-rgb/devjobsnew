
import { pgTable, text, serial, boolean, timestamp, jsonb, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User roles
export const userRoles = ["recruiter", "jobseeker"] as const;
export type UserRole = typeof userRoles[number];

// Users table (for both recruiters and job seekers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("jobseeker"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  city: text("city"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationCode: text("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recruiter profiles
export const recruiterProfiles = pgTable("recruiter_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationName: text("organization_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  country: text("country").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job seeker profiles (enhanced for AI-powered system)
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  professionalSummary: text("professional_summary"),
  currentJobTitle: text("current_job_title"),
  yearsOfExperience: integer("years_of_experience"),
  skills: text("skills").array(),
  languages: text("languages").array(),
  education: text("education"),
  certifications: text("certifications"),
  cvUrl: text("cv_url"),
  cvData: jsonb("cv_data"),
  profileCompleteness: integer("profile_completeness").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidate work experiences
export const candidateExperiences = pgTable("candidate_experiences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  responsibilities: text("responsibilities").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Candidate achievements (linked to experiences)
export const candidateAchievements = pgTable("candidate_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  experienceId: integer("experience_id").references(() => candidateExperiences.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  metrics: text("metrics"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Candidate projects
export const candidateProjects = pgTable("candidate_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  role: text("role"),
  technologies: text("technologies").array(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  projectUrl: text("project_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Candidate references
export const candidateReferences = pgTable("candidate_references", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  email: text("email"),
  phone: text("phone"),
  relationship: text("relationship"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job applications (for Easy Apply)
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id"),
  directJobId: integer("direct_job_id"),
  recruiterEmail: text("recruiter_email"),
  status: text("status").default("submitted"),
  appliedAt: timestamp("applied_at").defaultNow(),
  aiSuccessPrediction: integer("ai_success_prediction"),
  aiRecommendations: text("ai_recommendations"),
});

// Pending job posts (before payment is completed)
export const pendingJobs = pgTable("pending_jobs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  applyMethod: text("apply_method").notNull(),
  applyValue: text("apply_value").notNull(),
  remote: boolean("remote").default(false),
  tags: text("tags").array(),
  salary: text("salary"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Direct job posts (by recruiters on platform)
export const directJobs = pgTable("direct_jobs", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // un, ngo, international
  applyMethod: text("apply_method").notNull(), // "link" or "email"
  applyValue: text("apply_value").notNull(), // URL or email address
  remote: boolean("remote").default(false),
  tags: text("tags").array(),
  salary: text("salary"),
  postedAt: timestamp("posted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  emailVerified: true,
  verificationToken: true,
});

export const insertRecruiterProfileSchema = createInsertSchema(recruiterProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateExperienceSchema = createInsertSchema(candidateExperiences).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateAchievementSchema = createInsertSchema(candidateAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateProjectSchema = createInsertSchema(candidateProjects).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateReferenceSchema = createInsertSchema(candidateReferences).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
});

export const insertDirectJobSchema = createInsertSchema(directJobs).omit({
  id: true,
  createdAt: true,
  postedAt: true,
});

export const insertPendingJobSchema = createInsertSchema(pendingJobs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RecruiterProfile = typeof recruiterProfiles.$inferSelect;
export type InsertRecruiterProfile = z.infer<typeof insertRecruiterProfileSchema>;
export type JobSeekerProfile = typeof jobSeekerProfiles.$inferSelect;
export type InsertJobSeekerProfile = z.infer<typeof insertJobSeekerProfileSchema>;
export type DirectJob = typeof directJobs.$inferSelect;
export type InsertDirectJob = z.infer<typeof insertDirectJobSchema>;
export type PendingJob = typeof pendingJobs.$inferSelect;
export type InsertPendingJob = z.infer<typeof insertPendingJobSchema>;

export type CandidateExperience = typeof candidateExperiences.$inferSelect;
export type InsertCandidateExperience = z.infer<typeof insertCandidateExperienceSchema>;
export type CandidateAchievement = typeof candidateAchievements.$inferSelect;
export type InsertCandidateAchievement = z.infer<typeof insertCandidateAchievementSchema>;
export type CandidateProject = typeof candidateProjects.$inferSelect;
export type InsertCandidateProject = z.infer<typeof insertCandidateProjectSchema>;
export type CandidateReference = typeof candidateReferences.$inferSelect;
export type InsertCandidateReference = z.infer<typeof insertCandidateReferenceSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const jobCategories = ["un", "ngo", "international"] as const;
export type JobCategory = typeof jobCategories[number];

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique().notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  remote: boolean("remote").default(false),
  tags: text("tags").array(),
  salary: text("salary"),
  source: text("source").notNull(),
  category: text("category").default("international"),
  postedAt: timestamp("posted_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export interface JobFilter {
  search?: string;
  location?: string;
  remote?: boolean;
  category?: JobCategory;
}

// Export sessions table for Replit Auth
export * from "./models/auth";
