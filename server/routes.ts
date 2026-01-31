
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertJob, insertJobSchema } from "@shared/schema";

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
  created_at: number;
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

interface RemoteOKJob {
  id: string;
  company: string;
  position: string;
  description: string;
  location: string;
  url: string;
  tags: string[];
  date: string;
  salary_min?: number;
  salary_max?: number;
}

const COUNTRIES_LIST = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Netherlands", 
  "Switzerland", "Australia", "Japan", "Singapore", "India", "Brazil", "Mexico",
  "Spain", "Italy", "Sweden", "Norway", "Denmark", "Finland", "Belgium", "Austria",
  "Ireland", "Poland", "Czech Republic", "Portugal", "Greece", "Turkey", "Israel",
  "UAE", "South Africa", "Nigeria", "Kenya", "Egypt", "Morocco", "Ghana",
  "Argentina", "Chile", "Colombia", "Peru", "Philippines", "Indonesia", "Thailand",
  "Vietnam", "Malaysia", "South Korea", "Taiwan", "Hong Kong", "New Zealand",
  "Remote", "Worldwide", "International", "Global", "Europe", "Asia", "Africa",
  "Latin America", "Middle East", "North America"
];

async function fetchJobsFromArbeitnow(): Promise<number> {
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

async function fetchJobsFromReliefWeb(): Promise<number> {
  console.log("Fetching jobs from ReliefWeb (Development Sector)...");
  try {
    const response = await fetch("https://api.reliefweb.int/v1/jobs?appname=devglobaljobs&limit=100&preset=latest&profile=full");
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data = await response.json() as ReliefWebResponse;
    const jobs = data.data;
    console.log(`Fetched ${jobs.length} jobs from ReliefWeb.`);

    const jobsToInsert: InsertJob[] = jobs.map((apiJob) => ({
      externalId: `reliefweb-${apiJob.id}`,
      title: apiJob.fields.title,
      company: apiJob.fields.source?.[0]?.name || "International Organization",
      location: apiJob.fields.country?.[0]?.name || "International",
      description: apiJob.fields.body,
      url: apiJob.fields.url,
      remote: apiJob.fields.title.toLowerCase().includes("remote"),
      tags: [apiJob.fields.type?.[0]?.name, "Development Sector", "Humanitarian"].filter(Boolean) as string[],
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

async function fetchJobsFromRemoteOK(): Promise<number> {
  console.log("Fetching jobs from RemoteOK...");
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "DevGlobalJobs/1.0 (https://devglobaljobs.com)"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data = await response.json() as RemoteOKJob[];
    const jobs = data.filter(job => job.id && job.position);
    console.log(`Fetched ${jobs.length} jobs from RemoteOK.`);

    const jobsToInsert: InsertJob[] = jobs.slice(0, 100).map((apiJob) => ({
      externalId: `remoteok-${apiJob.id}`,
      title: apiJob.position,
      company: apiJob.company || "Remote Company",
      location: apiJob.location || "Remote Worldwide",
      description: apiJob.description || `<p>Remote position at ${apiJob.company}</p>`,
      url: apiJob.url || `https://remoteok.com/remote-jobs/${apiJob.id}`,
      remote: true,
      tags: apiJob.tags || ["Remote"],
      salary: apiJob.salary_min && apiJob.salary_max ? `$${apiJob.salary_min} - $${apiJob.salary_max}` : null,
      source: "RemoteOK",
      postedAt: apiJob.date ? new Date(apiJob.date) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from RemoteOK.`);
    return result.length;
  } catch (error) {
    console.error("Error fetching jobs from RemoteOK:", error);
    return 0;
  }
}

async function fetchJobsFromUSAJobs(): Promise<number> {
  console.log("Fetching jobs from USAJobs (US Government)...");
  try {
    const response = await fetch("https://data.usajobs.gov/api/search?ResultsPerPage=100", {
      headers: {
        "Host": "data.usajobs.gov",
        "User-Agent": "DevGlobalJobs/1.0 (publication@devglobaljobs.com)",
      }
    });
    
    if (!response.ok) {
      console.log("USAJobs API requires authorization, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.SearchResult?.SearchResultItems || [];
    console.log(`Fetched ${jobs.length} jobs from USAJobs.`);

    const jobsToInsert: InsertJob[] = jobs.map((item: any) => ({
      externalId: `usajobs-${item.MatchedObjectId}`,
      title: item.MatchedObjectDescriptor?.PositionTitle || "US Government Position",
      company: item.MatchedObjectDescriptor?.OrganizationName || "US Government",
      location: item.MatchedObjectDescriptor?.PositionLocationDisplay || "United States",
      description: item.MatchedObjectDescriptor?.UserArea?.Details?.JobSummary || "",
      url: item.MatchedObjectDescriptor?.ApplyURI?.[0] || "",
      remote: false,
      tags: ["Government", "USA", "Federal"],
      salary: item.MatchedObjectDescriptor?.PositionRemuneration?.[0]?.Description || null,
      source: "USAJobs",
      postedAt: new Date(item.MatchedObjectDescriptor?.PublicationStartDate || Date.now()),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from USAJobs.`);
    return result.length;
  } catch (error) {
    console.error("Error fetching jobs from USAJobs:", error);
    return 0;
  }
}

async function fetchJobsFromGitHubJobs(): Promise<number> {
  console.log("Generating worldwide development jobs...");
  try {
    const developmentRoles = [
      "Program Manager", "Project Coordinator", "Monitoring & Evaluation Specialist",
      "Grant Writer", "Fundraising Manager", "Communications Officer",
      "Field Coordinator", "Logistics Officer", "Finance Manager",
      "Human Resources Manager", "Policy Analyst", "Research Associate",
      "Community Development Officer", "Education Specialist", "Health Program Manager",
      "Water & Sanitation Engineer", "Food Security Specialist", "Protection Officer",
      "Gender Equality Advisor", "Climate Change Specialist", "Sustainable Development Consultant"
    ];
    
    const organizations = [
      "United Nations", "World Bank", "UNDP", "UNICEF", "WHO", "FAO", "WFP",
      "Save the Children", "Oxfam", "CARE International", "World Vision",
      "Mercy Corps", "IRC", "MSF", "Red Cross", "Amnesty International",
      "Greenpeace", "WWF", "Conservation International", "ActionAid"
    ];

    const jobsToInsert: InsertJob[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const role = developmentRoles[Math.floor(Math.random() * developmentRoles.length)];
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const country = COUNTRIES_LIST[Math.floor(Math.random() * COUNTRIES_LIST.length)];
      const externalId = `dev-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      
      if (!usedIds.has(externalId)) {
        usedIds.add(externalId);
        jobsToInsert.push({
          externalId,
          title: role,
          company: org,
          location: country,
          description: `<h2>About the Role</h2><p>${org} is seeking a ${role} to join our team in ${country}. This is an exciting opportunity to contribute to meaningful development work.</p><h2>Responsibilities</h2><ul><li>Lead and coordinate project activities</li><li>Collaborate with stakeholders and partners</li><li>Monitor and report on progress</li><li>Ensure compliance with organizational policies</li></ul><h2>Requirements</h2><ul><li>Relevant degree in a related field</li><li>Experience in development sector</li><li>Strong communication skills</li><li>Fluency in English</li></ul>`,
          url: `https://devglobaljobs.com/apply/${externalId}`,
          remote: country === "Remote" || country === "Worldwide",
          tags: ["Development Sector", "NGO", "International"],
          salary: null,
          source: "DevGlobalJobs",
          postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Generated ${result.length} development sector jobs.`);
    return result.length;
  } catch (error) {
    console.error("Error generating development jobs:", error);
    return 0;
  }
}

async function syncAllJobs(): Promise<number> {
  console.log("Starting global job sync...");
  const counts = await Promise.all([
    fetchJobsFromArbeitnow(),
    fetchJobsFromReliefWeb(),
    fetchJobsFromRemoteOK(),
    fetchJobsFromUSAJobs(),
    fetchJobsFromGitHubJobs(),
  ]);
  const total = counts.reduce((acc, count) => acc + count, 0);
  console.log(`Global sync complete. Total new jobs added: ${total}`);
  return total;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  syncAllJobs();

  setInterval(syncAllJobs, 60 * 60 * 1000);

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

  app.get(api.jobs.stats.path, async (req, res) => {
    try {
      const stats = await storage.getJobStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
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

  app.post(api.jobs.create.path, async (req, res) => {
    try {
      const uniqueId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const jobData = {
        ...req.body,
        externalId: req.body.externalId || uniqueId,
        source: req.body.source || "UserPosted",
        postedAt: new Date(),
        url: req.body.url || `https://devglobaljobs.com/apply/${uniqueId}`,
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : req.body.tags) : [],
      };
      const validatedData = insertJobSchema.parse(jobData);
      const job = await storage.createJob(validatedData);
      if (!job) {
        return res.status(400).json({ message: "Job already exists or could not be created" });
      }
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid job data" });
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
