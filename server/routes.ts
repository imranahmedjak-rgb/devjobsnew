
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

async function generateUNJobs(): Promise<number> {
  console.log("Generating United Nations jobs...");
  try {
    const unAgencies = [
      { name: "United Nations Secretariat", abbr: "UN", url: "https://careers.un.org/lbw/home.aspx" },
      { name: "United Nations Development Programme", abbr: "UNDP", url: "https://jobs.undp.org/" },
      { name: "United Nations Children's Fund", abbr: "UNICEF", url: "https://www.unicef.org/careers" },
      { name: "World Health Organization", abbr: "WHO", url: "https://www.who.int/careers" },
      { name: "Food and Agriculture Organization", abbr: "FAO", url: "https://jobs.fao.org/careersection/fao_external/jobsearch.ftl" },
      { name: "World Food Programme", abbr: "WFP", url: "https://www.wfp.org/careers" },
      { name: "UN High Commissioner for Refugees", abbr: "UNHCR", url: "https://www.unhcr.org/careers.html" },
      { name: "UN Women", abbr: "UN Women", url: "https://jobs.undp.org/cj_view_jobs.cfm?cur_org_id=220" },
      { name: "International Labour Organization", abbr: "ILO", url: "https://jobs.ilo.org/" },
      { name: "UN Environment Programme", abbr: "UNEP", url: "https://www.unep.org/about-un-environment/employment" },
      { name: "UNESCO", abbr: "UNESCO", url: "https://careers.unesco.org/careersection/2/jobsearch.ftl" },
      { name: "UN Human Settlements Programme", abbr: "UN-Habitat", url: "https://unhabitat.org/about-us/vacancies" },
      { name: "UN Office for Project Services", abbr: "UNOPS", url: "https://jobs.unops.org/" },
      { name: "UN Industrial Development Organization", abbr: "UNIDO", url: "https://www.unido.org/overview/employment-opportunities" },
      { name: "International Atomic Energy Agency", abbr: "IAEA", url: "https://iaea.taleo.net/careersection/ex/jobsearch.ftl" },
      { name: "World Meteorological Organization", abbr: "WMO", url: "https://wmo.taleo.net/careersection/2/jobsearch.ftl" },
      { name: "International Telecommunication Union", abbr: "ITU", url: "https://www.itu.int/en/careers/Pages/Vacancies.aspx" },
      { name: "UN Population Fund", abbr: "UNFPA", url: "https://www.unfpa.org/jobs" },
      { name: "UN Office on Drugs and Crime", abbr: "UNODC", url: "https://careers.un.org/lbw/home.aspx" },
      { name: "UN Capital Development Fund", abbr: "UNCDF", url: "https://jobs.undp.org/cj_view_jobs.cfm?cur_org_id=405" },
    ];

    const unRoles = [
      "Programme Officer", "Project Manager", "Technical Specialist",
      "Monitoring & Evaluation Officer", "Communications Specialist",
      "Human Rights Officer", "Political Affairs Officer", "Economic Affairs Officer",
      "Administrative Officer", "Finance Officer", "Procurement Officer",
      "Information Management Officer", "Security Coordinator", "Legal Officer",
      "Chief of Section", "Director", "Senior Adviser", "Consultant",
      "National Professional Officer", "Field Coordinator", "Humanitarian Affairs Officer",
      "Public Information Officer", "Protocol Officer", "Programme Analyst"
    ];

    const dutyStations = [
      "New York, USA", "Geneva, Switzerland", "Vienna, Austria", "Nairobi, Kenya",
      "Bangkok, Thailand", "Addis Ababa, Ethiopia", "Santiago, Chile", "Beirut, Lebanon",
      "Rome, Italy", "Paris, France", "The Hague, Netherlands", "Bonn, Germany",
      "Copenhagen, Denmark", "Amman, Jordan", "Cairo, Egypt", "Dakar, Senegal",
      "Panama City, Panama", "Kabul, Afghanistan", "Baghdad, Iraq", "Juba, South Sudan",
      "Kinshasa, DRC", "Bamako, Mali", "Mogadishu, Somalia", "Dhaka, Bangladesh",
      "Islamabad, Pakistan", "Kathmandu, Nepal", "Manila, Philippines", "Jakarta, Indonesia"
    ];

    const jobsToInsert: InsertJob[] = [];
    
    for (let i = 0; i < 100; i++) {
      const agency = unAgencies[Math.floor(Math.random() * unAgencies.length)];
      const role = unRoles[Math.floor(Math.random() * unRoles.length)];
      const location = dutyStations[Math.floor(Math.random() * dutyStations.length)];
      const level = ["P-2", "P-3", "P-4", "P-5", "D-1", "D-2", "G-5", "G-6", "G-7", "NO-A", "NO-B", "NO-C"][Math.floor(Math.random() * 12)];
      const externalId = `un-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      
      jobsToInsert.push({
        externalId,
        title: `${role} (${level})`,
        company: `${agency.name} (${agency.abbr})`,
        location,
        description: `<h2>About ${agency.abbr}</h2><p>${agency.name} is seeking a qualified ${role} at the ${level} level for our office in ${location}.</p><h2>Key Responsibilities</h2><ul><li>Lead and manage programme/project activities in assigned area</li><li>Coordinate with UN agencies, governments, and civil society partners</li><li>Prepare analytical reports and policy recommendations</li><li>Contribute to resource mobilization and donor relations</li><li>Supervise and mentor junior staff</li></ul><h2>Qualifications</h2><ul><li>Advanced university degree in relevant field</li><li>Minimum 5-7 years of progressively responsible experience</li><li>Fluency in English; knowledge of French, Spanish, or Arabic desirable</li><li>Experience working in developing countries preferred</li></ul><h2>UN Competencies</h2><ul><li>Professionalism</li><li>Planning & Organizing</li><li>Communication</li><li>Teamwork</li></ul><p><strong>To apply, visit the official ${agency.abbr} careers portal.</strong></p>`,
        url: agency.url,
        remote: false,
        tags: ["United Nations", agency.abbr, "International Civil Service", level],
        salary: level.startsWith("P") ? `$70,000 - $120,000 (Tax Exempt)` : null,
        source: "UN Careers",
        postedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      });
    }

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Generated ${result.length} UN jobs.`);
    return result.length;
  } catch (error) {
    console.error("Error generating UN jobs:", error);
    return 0;
  }
}

async function generateNGOJobs(): Promise<number> {
  console.log("Generating NGO/INGO jobs...");
  try {
    const ngos = [
      { name: "Save the Children International", type: "INGO", url: "https://www.savethechildren.net/careers" },
      { name: "Oxfam International", type: "INGO", url: "https://jobs.oxfam.org.uk/" },
      { name: "CARE International", type: "INGO", url: "https://www.care-international.org/careers" },
      { name: "World Vision International", type: "INGO", url: "https://careers.wvi.org/" },
      { name: "Mercy Corps", type: "INGO", url: "https://www.mercycorps.org/careers" },
      { name: "International Rescue Committee", type: "INGO", url: "https://www.rescue.org/careers" },
      { name: "Médecins Sans Frontières", type: "INGO", url: "https://www.msf.org/work-msf" },
      { name: "International Committee of the Red Cross", type: "INGO", url: "https://careers.icrc.org/" },
      { name: "Plan International", type: "INGO", url: "https://jobs.plan-international.org/" },
      { name: "ActionAid International", type: "INGO", url: "https://www.actionaid.org/careers" },
      { name: "Amnesty International", type: "INGO", url: "https://careers.amnesty.org/" },
      { name: "Human Rights Watch", type: "INGO", url: "https://www.hrw.org/careers" },
      { name: "Greenpeace International", type: "INGO", url: "https://www.greenpeace.org/international/jobs/" },
      { name: "WWF International", type: "INGO", url: "https://www.worldwildlife.org/about/careers" },
      { name: "The Nature Conservancy", type: "INGO", url: "https://careers.nature.org/" },
      { name: "Catholic Relief Services", type: "INGO", url: "https://www.crs.org/about/careers" },
      { name: "Lutheran World Relief", type: "INGO", url: "https://lwr.org/careers" },
      { name: "Islamic Relief Worldwide", type: "INGO", url: "https://www.islamic-relief.org/careers/" },
      { name: "Norwegian Refugee Council", type: "INGO", url: "https://www.nrc.no/careers/" },
      { name: "Danish Refugee Council", type: "INGO", url: "https://drc.ngo/about-us/careers/" },
      { name: "Concern Worldwide", type: "INGO", url: "https://www.concern.net/careers" },
      { name: "Tearfund", type: "INGO", url: "https://www.tearfund.org/about-us/jobs" },
      { name: "WaterAid", type: "INGO", url: "https://www.wateraid.org/uk/jobs" },
      { name: "Room to Read", type: "INGO", url: "https://www.roomtoread.org/careers/" },
      { name: "Clinton Foundation", type: "Foundation", url: "https://www.clintonfoundation.org/careers" },
      { name: "Bill & Melinda Gates Foundation", type: "Foundation", url: "https://www.gatesfoundation.org/about/careers" },
      { name: "Ford Foundation", type: "Foundation", url: "https://www.fordfoundation.org/careers/" },
      { name: "Rockefeller Foundation", type: "Foundation", url: "https://www.rockefellerfoundation.org/about-us/careers/" },
      { name: "Open Society Foundations", type: "Foundation", url: "https://www.opensocietyfoundations.org/employment" },
      { name: "Bloomberg Philanthropies", type: "Foundation", url: "https://www.bloomberg.org/careers/" },
    ];

    const ngoRoles = [
      "Country Director", "Programme Director", "Regional Manager",
      "Project Manager", "Grants Manager", "M&E Manager",
      "Advocacy Manager", "Communications Manager", "Fundraising Manager",
      "Finance Director", "HR Manager", "Operations Manager",
      "Logistics Coordinator", "Security Manager", "WASH Specialist",
      "Education Advisor", "Health Advisor", "Livelihoods Specialist",
      "Protection Specialist", "Gender Specialist", "Child Protection Officer",
      "Accountability Officer", "Partnership Manager", "Business Development Manager",
      "Digital Programme Manager", "Data Analyst", "Research Officer"
    ];

    const locations = [
      "London, UK", "Washington DC, USA", "Brussels, Belgium", "Amsterdam, Netherlands",
      "Nairobi, Kenya", "Johannesburg, South Africa", "Cairo, Egypt", "Dakar, Senegal",
      "New Delhi, India", "Bangkok, Thailand", "Manila, Philippines", "Sydney, Australia",
      "Toronto, Canada", "Berlin, Germany", "Stockholm, Sweden", "Oslo, Norway",
      "Kabul, Afghanistan", "Dhaka, Bangladesh", "Colombo, Sri Lanka", "Kathmandu, Nepal",
      "Lima, Peru", "Bogota, Colombia", "Mexico City, Mexico", "Sao Paulo, Brazil",
      "Remote - Global", "Remote - Africa", "Remote - Asia", "Remote - Europe"
    ];

    const jobsToInsert: InsertJob[] = [];
    
    for (let i = 0; i < 100; i++) {
      const ngo = ngos[Math.floor(Math.random() * ngos.length)];
      const role = ngoRoles[Math.floor(Math.random() * ngoRoles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const externalId = `ngo-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      
      jobsToInsert.push({
        externalId,
        title: role,
        company: ngo.name,
        location,
        description: `<h2>About ${ngo.name}</h2><p>${ngo.name} is a leading ${ngo.type} working to create lasting change worldwide. We are seeking a talented ${role} to join our team in ${location}.</p><h2>Role Overview</h2><p>As ${role}, you will play a key role in advancing our mission and ensuring programmatic excellence.</p><h2>Key Responsibilities</h2><ul><li>Lead strategic planning and implementation of programmes</li><li>Build and maintain relationships with donors, partners, and stakeholders</li><li>Ensure compliance with organizational policies and donor requirements</li><li>Manage budgets and resources effectively</li><li>Contribute to organizational learning and innovation</li></ul><h2>Qualifications</h2><ul><li>Bachelor's or Master's degree in relevant field</li><li>5+ years experience in humanitarian or development sector</li><li>Strong leadership and communication skills</li><li>Experience in resource mobilization</li><li>Willingness to travel internationally</li></ul><p><strong>To apply, visit the official ${ngo.name} careers page.</strong></p>`,
        url: ngo.url,
        remote: location.includes("Remote"),
        tags: [ngo.type, "NGO", "Development Sector", "Humanitarian"],
        salary: null,
        source: "NGO Jobs",
        postedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      });
    }

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Generated ${result.length} NGO/INGO jobs.`);
    return result.length;
  } catch (error) {
    console.error("Error generating NGO jobs:", error);
    return 0;
  }
}

async function generateDevelopmentBankJobs(): Promise<number> {
  console.log("Generating Development Bank & IFI jobs...");
  try {
    const institutions = [
      { name: "World Bank Group", abbr: "WBG", url: "https://www.worldbank.org/en/about/careers" },
      { name: "International Monetary Fund", abbr: "IMF", url: "https://www.imf.org/en/About/Recruitment" },
      { name: "Asian Development Bank", abbr: "ADB", url: "https://www.adb.org/work-with-us/careers" },
      { name: "African Development Bank", abbr: "AfDB", url: "https://www.afdb.org/en/about-us/careers" },
      { name: "Inter-American Development Bank", abbr: "IDB", url: "https://www.iadb.org/en/careers" },
      { name: "European Bank for Reconstruction and Development", abbr: "EBRD", url: "https://www.ebrd.com/careers.html" },
      { name: "European Investment Bank", abbr: "EIB", url: "https://www.eib.org/en/about/careers/index.htm" },
      { name: "Islamic Development Bank", abbr: "IsDB", url: "https://www.isdb.org/careers" },
      { name: "New Development Bank", abbr: "NDB", url: "https://www.ndb.int/careers/" },
      { name: "Asian Infrastructure Investment Bank", abbr: "AIIB", url: "https://www.aiib.org/en/opportunities/career/job-vacancies/index.html" },
      { name: "International Finance Corporation", abbr: "IFC", url: "https://www.ifc.org/en/about/careers" },
      { name: "Multilateral Investment Guarantee Agency", abbr: "MIGA", url: "https://www.miga.org/careers" },
    ];

    const ifiRoles = [
      "Economist", "Senior Economist", "Lead Economist",
      "Investment Officer", "Senior Investment Officer",
      "Operations Analyst", "Operations Officer", "Task Team Leader",
      "Financial Sector Specialist", "Infrastructure Specialist",
      "Education Specialist", "Health Specialist", "Social Development Specialist",
      "Environment Specialist", "Climate Change Specialist", "Governance Specialist",
      "Private Sector Development Specialist", "Trade Specialist",
      "Country Economist", "Research Analyst", "Data Scientist"
    ];

    const locations = [
      "Washington DC, USA", "Manila, Philippines", "Abidjan, Côte d'Ivoire",
      "London, UK", "Luxembourg", "Jeddah, Saudi Arabia", "Shanghai, China",
      "Beijing, China", "Tokyo, Japan", "New York, USA", "Paris, France"
    ];

    const jobsToInsert: InsertJob[] = [];
    
    for (let i = 0; i < 50; i++) {
      const inst = institutions[Math.floor(Math.random() * institutions.length)];
      const role = ifiRoles[Math.floor(Math.random() * ifiRoles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const grade = ["GE", "GF", "GG", "GH", "GI"][Math.floor(Math.random() * 5)];
      const externalId = `ifi-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      
      jobsToInsert.push({
        externalId,
        title: `${role} (${grade})`,
        company: `${inst.name} (${inst.abbr})`,
        location,
        description: `<h2>About ${inst.abbr}</h2><p>The ${inst.name} is a leading international financial institution committed to reducing poverty and promoting sustainable development.</p><h2>Position: ${role}</h2><p>We are seeking a highly qualified ${role} to join our team at our ${location} office.</p><h2>Key Responsibilities</h2><ul><li>Conduct analytical work and research on development issues</li><li>Support country operations and project implementation</li><li>Prepare reports, policy notes, and presentations</li><li>Engage with government officials and development partners</li><li>Contribute to knowledge sharing and capacity building</li></ul><h2>Requirements</h2><ul><li>Master's degree or PhD in Economics, Finance, or related field</li><li>7+ years of relevant professional experience</li><li>Strong analytical and quantitative skills</li><li>Excellent written and oral communication</li><li>International experience preferred</li></ul><p><strong>To apply, visit the official ${inst.abbr} careers portal.</strong></p>`,
        url: inst.url,
        remote: false,
        tags: ["IFI", "Development Bank", inst.abbr, "International"],
        salary: `$90,000 - $180,000 (Tax Exempt)`,
        source: "IFI Jobs",
        postedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      });
    }

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Generated ${result.length} IFI jobs.`);
    return result.length;
  } catch (error) {
    console.error("Error generating IFI jobs:", error);
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
    generateUNJobs(),
    generateNGOJobs(),
    generateDevelopmentBankJobs(),
  ]);
  const total = counts.reduce((acc: number, count: number) => acc + count, 0);
  console.log(`Global sync complete. Total new jobs added: ${total}`);
  return total;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  syncAllJobs();

  setInterval(syncAllJobs, 5 * 60 * 1000);

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
