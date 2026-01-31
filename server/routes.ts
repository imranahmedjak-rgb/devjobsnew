
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

async function fetchJobsFromArbeitnow() {
  console.log("Fetching jobs from Arbeitnow...");
  try {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data = await response.json() as ArbeitnowResponse;
    const jobs = data.data;
    console.log(`Fetched ${jobs.length} jobs from API.`);

    const jobsToInsert: InsertJob[] = jobs.map((apiJob) => ({
      externalId: apiJob.slug,
      title: apiJob.title,
      company: apiJob.company_name,
      location: apiJob.location,
      description: apiJob.description,
      url: apiJob.url,
      remote: apiJob.remote,
      tags: apiJob.tags,
      salary: null,
      source: "arbeitnow",
      postedAt: new Date(apiJob.created_at * 1000), // convert unix timestamp to Date
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs.`);
    return result.length;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return 0;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initial fetch on startup
  fetchJobsFromArbeitnow();

  // Schedule fetch every hour (3600000 ms)
  setInterval(fetchJobsFromArbeitnow, 60 * 60 * 1000);

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
      const count = await fetchJobsFromArbeitnow();
      res.json({ message: "Sync complete", count });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync jobs" });
    }
  });

  return httpServer;
}
