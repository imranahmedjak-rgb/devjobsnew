
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
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
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

// Job seeker profiles
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  experience: text("experience"),
  expertise: text("expertise"),
  cvUrl: text("cv_url"),
  createdAt: timestamp("created_at").defaultNow(),
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
});

export const insertDirectJobSchema = createInsertSchema(directJobs).omit({
  id: true,
  createdAt: true,
  postedAt: true,
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
