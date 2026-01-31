
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertJob } from "@shared/schema";

// External API types
interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // unix timestamp
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: { next?: string };
}

interface ReliefWebJob {
  id: string;
  fields: {
    title: string;
    body: string;
    url: string;
    source: { name: string }[];
    city?: { name: string }[];
    country: { name: string }[];
    date: { created: string };
    type: { name: string }[];
  };
}

interface ReliefWebResponse {
  data: ReliefWebJob[];
}

async function fetchJobsFromArbeitnow() {
  console.log("Fetching jobs from Arbeitnow...");
  try {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data = await response.json() as ArbeitnowResponse;
    const jobs = data.data;
    console.log(`Fetched ${jobs.length} jobs from Arbeitnow.`);

    const jobsToInsert: InsertJob[] = jobs.map((apiJob) => ({
      externalId: `arbeitnow-${apiJob.slug}`,
      title: apiJob.title,
      company: apiJob.company_name,
      location: apiJob.location,
      description: apiJob.description,
      url: apiJob.url,
      remote: apiJob.remote,
      tags: apiJob.tags,
      salary: null,
      source: "Arbeitnow",
      postedAt: new Date(apiJob.created_at * 1000),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Arbeitnow.`);
    return result.length;
  } catch (error) {
    console.error("Error fetching jobs from Arbeitnow:", error);
    return 0;
  }
}

async function fetchJobsFromReliefWeb() {
  console.log("Fetching jobs from ReliefWeb (Development Sector)...");
  try {
    const response = await fetch("https://api.reliefweb.int/v1/jobs?appname=jobboard&limit=20&preset=latest&profile=full");
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data = await response.json() as ReliefWebResponse;
    const jobs = data.data;
    console.log(`Fetched ${jobs.length} jobs from ReliefWeb.`);

    const jobsToInsert: InsertJob[] = jobs.map((apiJob) => ({
      externalId: `reliefweb-${apiJob.id}`,
      title: apiJob.fields.title,
      company: apiJob.fields.source?.[0]?.name || "NGO / International Organization",
      location: apiJob.fields.country?.[0]?.name || "International",
      description: apiJob.fields.body,
      url: apiJob.fields.url,
      remote: apiJob.fields.title.toLowerCase().includes("remote"),
      tags: [apiJob.fields.type?.[0]?.name, "Development Sector"].filter(Boolean) as string[],
      salary: null,
      source: "ReliefWeb",
      postedAt: new Date(apiJob.fields.date.created),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from ReliefWeb.`);
    return result.length;
  } catch (error) {
    console.error("Error fetching jobs from ReliefWeb:", error);
    return 0;
  }
}

async function syncAllJobs() {
  console.log("Starting full daily sync...");
  const counts = await Promise.all([
    fetchJobsFromArbeitnow(),
    fetchJobsFromReliefWeb()
  ]);
  const total = counts.reduce((acc, count) => acc + count, 0);
  console.log(`Full sync complete. Total new jobs added: ${total}`);
  return total;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initial sync on startup
  syncAllJobs();

  // Schedule daily sync
  setInterval(syncAllJobs, 24 * 60 * 60 * 1000);

  app.get(api.jobs.list.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        location: req.query.location as string,
        remote: req.query.remote === 'true',
      };
      const jobs = await storage.getJobs(filters);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get(api.jobs.get.path, async (req, res) => {
    try {
      const job = await storage.getJob(Number(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post(api.jobs.sync.path, async (req, res) => {
    try {
      const count = await syncAllJobs();
      res.json({ message: "Sync complete", count });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync jobs" });
    }
  });

  return httpServer;
}
