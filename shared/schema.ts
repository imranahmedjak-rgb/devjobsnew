
import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique().notNull(), // slug from API
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(), // HTML content
  url: text("url").notNull(),
  remote: boolean("remote").default(false),
  tags: text("tags").array(),
  salary: text("salary"),
  source: text("source").notNull(), // e.g. 'arbeitnow'
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
}
