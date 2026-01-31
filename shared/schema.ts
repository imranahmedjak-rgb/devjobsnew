
import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  category: text("category").default("development"),
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
