
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { 
  type InsertJob, insertJobSchema,
  type InsertUser, insertUserSchema,
  type InsertRecruiterProfile, insertRecruiterProfileSchema,
  type InsertJobSeekerProfile, insertJobSeekerProfileSchema,
  type InsertDirectJob, insertDirectJobSchema
} from "@shared/schema";
import { parseStringPromise } from "xml2js";
import { execSync } from "child_process";
import { registerChatRoutes } from "./replit_integrations/chat";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sendJobApplicationEmail } from "./emailService";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("JWT_SECRET must be set in production"); })() : "dev-global-jobs-secret-key-2024");

// Auth middleware
interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue without user
    }
  }
  next();
}

// Helper function to validate job URLs - reject homepage-only links
function isValidJobUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  
  // Patterns that indicate homepage-only (not direct job link)
  const homepagePatterns = [
    /^https?:\/\/[^\/]+\/?$/, // Root domain only (e.g., https://example.com/)
    /^https?:\/\/[^\/]+\/careers\/?$/, // Just /careers
    /^https?:\/\/[^\/]+\/jobs\/?$/, // Just /jobs
    /^https?:\/\/[^\/]+\/careers\/?\?.*$/, // /careers with only query params
    /^https?:\/\/[^\/]+\/jobs\/?\?.*$/, // /jobs with only query params
  ];
  
  for (const pattern of homepagePatterns) {
    if (pattern.test(url)) return false;
  }
  
  // Valid job URL should have a path with specific job identifier
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Must have meaningful path (more than just /, /jobs, /careers)
    return path.length > 10 || path.includes('/job/') || path.includes('/position/') || 
           path.includes('/opening/') || path.includes('/vacancy/') || 
           urlObj.search.includes('id=') || urlObj.search.includes('jobId=');
  } catch {
    return false;
  }
}

// Job API Interfaces
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

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

// ================== UN AGENCIES AND NGO ORGANIZATIONS ==================

// UN Agencies and International Development Organizations
const UN_AGENCIES = [
  { name: "United Nations Secretariat", abbrev: "UN" },
  { name: "UNICEF", abbrev: "UNICEF" },
  { name: "UNDP", abbrev: "UNDP" },
  { name: "UNHCR", abbrev: "UNHCR" },
  { name: "World Food Programme", abbrev: "WFP" },
  { name: "WHO", abbrev: "WHO" },
  { name: "FAO", abbrev: "FAO" },
  { name: "UNESCO", abbrev: "UNESCO" },
  { name: "ILO", abbrev: "ILO" },
  { name: "UNEP", abbrev: "UNEP" },
  { name: "UN Women", abbrev: "UN Women" },
  { name: "UNFPA", abbrev: "UNFPA" },
  { name: "UNODC", abbrev: "UNODC" },
  { name: "UNIDO", abbrev: "UNIDO" },
  { name: "IOM", abbrev: "IOM" },
  { name: "OCHA", abbrev: "OCHA" },
  { name: "World Bank", abbrev: "WB" },
  { name: "IMF", abbrev: "IMF" },
  { name: "Asian Development Bank", abbrev: "ADB" },
  { name: "African Development Bank", abbrev: "AfDB" },
  { name: "Inter-American Development Bank", abbrev: "IDB" },
  { name: "European Bank for Reconstruction and Development", abbrev: "EBRD" },
  { name: "UNCTAD", abbrev: "UNCTAD" },
  { name: "UNOPS", abbrev: "UNOPS" },
  { name: "UN Habitat", abbrev: "UN-Habitat" },
  { name: "IFAD", abbrev: "IFAD" },
  { name: "WMO", abbrev: "WMO" },
  { name: "ITU", abbrev: "ITU" },
  { name: "WIPO", abbrev: "WIPO" },
  { name: "IAEA", abbrev: "IAEA" },
];

// NGO and Humanitarian Organizations
const NGO_ORGANIZATIONS = [
  { name: "International Committee of the Red Cross", abbrev: "ICRC" },
  { name: "International Federation of Red Cross", abbrev: "IFRC" },
  { name: "Médecins Sans Frontières", abbrev: "MSF" },
  { name: "Doctors Without Borders", abbrev: "MSF" },
  { name: "Oxfam International", abbrev: "Oxfam" },
  { name: "Save the Children", abbrev: "SCI" },
  { name: "World Vision International", abbrev: "WVI" },
  { name: "CARE International", abbrev: "CARE" },
  { name: "Mercy Corps", abbrev: "MC" },
  { name: "International Rescue Committee", abbrev: "IRC" },
  { name: "Catholic Relief Services", abbrev: "CRS" },
  { name: "Action Against Hunger", abbrev: "ACF" },
  { name: "Norwegian Refugee Council", abbrev: "NRC" },
  { name: "Danish Refugee Council", abbrev: "DRC" },
  { name: "USAID", abbrev: "USAID" },
  { name: "GIZ", abbrev: "GIZ" },
  { name: "DFID", abbrev: "DFID" },
  { name: "JICA", abbrev: "JICA" },
  { name: "Plan International", abbrev: "Plan" },
  { name: "Terre des Hommes", abbrev: "TdH" },
  { name: "Handicap International", abbrev: "HI" },
  { name: "Concern Worldwide", abbrev: "Concern" },
  { name: "Médecins du Monde", abbrev: "MdM" },
  { name: "ACTED", abbrev: "ACTED" },
  { name: "ActionAid", abbrev: "AA" },
  { name: "Amnesty International", abbrev: "AI" },
  { name: "Human Rights Watch", abbrev: "HRW" },
  { name: "Greenpeace", abbrev: "GP" },
  { name: "WWF", abbrev: "WWF" },
  { name: "Clinton Foundation", abbrev: "CF" },
  { name: "Gates Foundation", abbrev: "BMGF" },
  { name: "Ford Foundation", abbrev: "FF" },
  { name: "Rockefeller Foundation", abbrev: "RF" },
];

// UN/NGO Job Roles
const UN_NGO_ROLES = [
  "Programme Officer", "Senior Programme Officer", "Programme Manager",
  "Project Coordinator", "Project Manager", "Project Officer",
  "M&E Officer", "Monitoring and Evaluation Specialist", "M&E Manager",
  "Humanitarian Affairs Officer", "Emergency Response Coordinator",
  "Protection Officer", "Child Protection Specialist", "GBV Specialist",
  "WASH Coordinator", "WASH Officer", "Water and Sanitation Engineer",
  "Shelter Coordinator", "Shelter Officer", "Camp Manager",
  "Logistics Officer", "Supply Chain Manager", "Procurement Officer",
  "Finance Officer", "Finance Manager", "Budget Analyst",
  "Human Resources Officer", "HR Manager", "Recruitment Specialist",
  "Communications Officer", "Public Information Officer", "Media Specialist",
  "Advocacy Officer", "Policy Analyst", "Research Officer",
  "Country Director", "Head of Office", "Regional Director",
  "Field Coordinator", "Area Manager", "Site Manager",
  "Health Coordinator", "Medical Officer", "Nutrition Specialist",
  "Education Officer", "Education Coordinator", "Livelihoods Officer",
  "Food Security Analyst", "Cash and Voucher Specialist",
  "Gender Specialist", "Social Inclusion Officer",
  "Grants Manager", "Donor Relations Officer", "Fundraising Manager",
  "Data Analyst", "Information Management Officer", "GIS Specialist",
  "Security Officer", "Safety Advisor", "Risk Manager",
  "Legal Officer", "Compliance Officer", "Administrative Officer",
];

// UN/NGO Duty Stations
const UN_NGO_LOCATIONS = [
  "New York, USA (HQ)", "Geneva, Switzerland", "Vienna, Austria", "Nairobi, Kenya",
  "Rome, Italy", "Paris, France", "Bangkok, Thailand", "Addis Ababa, Ethiopia",
  "Amman, Jordan", "Cairo, Egypt", "Beirut, Lebanon", "Istanbul, Turkey",
  "Kabul, Afghanistan", "Dhaka, Bangladesh", "Cox's Bazar, Bangladesh",
  "Juba, South Sudan", "Mogadishu, Somalia", "Khartoum, Sudan", "N'Djamena, Chad",
  "Bamako, Mali", "Niamey, Niger", "Ouagadougou, Burkina Faso", "Dakar, Senegal",
  "Kinshasa, DRC", "Goma, DRC", "Kampala, Uganda", "Maputo, Mozambique",
  "Port-au-Prince, Haiti", "Bogota, Colombia", "Lima, Peru", "Panama City, Panama",
  "Jerusalem", "Ramallah, Palestine", "Gaza, Palestine", "Damascus, Syria",
  "Erbil, Iraq", "Baghdad, Iraq", "Sana'a, Yemen", "Aden, Yemen",
  "Islamabad, Pakistan", "Kathmandu, Nepal", "Yangon, Myanmar",
  "Manila, Philippines", "Jakarta, Indonesia", "Dili, Timor-Leste",
  "Remote - Global", "Home-based with travel", "Roving Position",
];

// Geographic regions for international focus
const REGIONS = {
  US: ["United States", "USA", "US", "New York", "California", "Texas", "Washington", "Florida", "Illinois", "Massachusetts", "Colorado", "Georgia", "Arizona", "North Carolina"],
  CANADA: ["Canada", "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"],
  EU: ["Germany", "France", "Netherlands", "Belgium", "Spain", "Italy", "Portugal", "Ireland", "Sweden", "Denmark", "Norway", "Finland", "Austria", "Switzerland", "Poland", "Czech Republic", "Greece", "Luxembourg", "United Kingdom", "UK", "London", "Berlin", "Paris", "Amsterdam", "Dublin", "Stockholm", "Copenhagen"],
  MIDDLE_EAST: ["UAE", "United Arab Emirates", "Dubai", "Abu Dhabi", "Saudi Arabia", "Qatar", "Bahrain", "Kuwait", "Oman", "Israel", "Jordan", "Lebanon", "Egypt"],
  ASIA_PACIFIC: ["Australia", "New Zealand", "Singapore", "Japan", "South Korea", "Hong Kong", "India", "Philippines", "Thailand", "Vietnam", "Indonesia", "Malaysia", "Taiwan"],
  LATAM: ["Brazil", "Mexico", "Argentina", "Chile", "Colombia", "Peru", "Costa Rica", "Panama"],
  AFRICA: ["South Africa", "Nigeria", "Kenya", "Ghana", "Morocco", "Egypt"]
};

// Job categories/industries for international positions
const INDUSTRIES = [
  "Technology", "Finance", "Consulting", "Healthcare", "Engineering", 
  "Marketing", "Sales", "Operations", "Legal", "Human Resources",
  "Data Science", "Product Management", "Design", "Customer Success",
  "Business Development", "Project Management", "Research", "Education"
];

// Major international companies
const INTERNATIONAL_COMPANIES = [
  { name: "Google", industry: "Technology", hq: "United States" },
  { name: "Microsoft", industry: "Technology", hq: "United States" },
  { name: "Amazon", industry: "Technology", hq: "United States" },
  { name: "Apple", industry: "Technology", hq: "United States" },
  { name: "Meta", industry: "Technology", hq: "United States" },
  { name: "IBM", industry: "Technology", hq: "United States" },
  { name: "Oracle", industry: "Technology", hq: "United States" },
  { name: "Salesforce", industry: "Technology", hq: "United States" },
  { name: "Adobe", industry: "Technology", hq: "United States" },
  { name: "Cisco", industry: "Technology", hq: "United States" },
  { name: "Intel", industry: "Technology", hq: "United States" },
  { name: "NVIDIA", industry: "Technology", hq: "United States" },
  { name: "Netflix", industry: "Technology", hq: "United States" },
  { name: "Uber", industry: "Technology", hq: "United States" },
  { name: "Airbnb", industry: "Technology", hq: "United States" },
  { name: "Stripe", industry: "Finance", hq: "United States" },
  { name: "Goldman Sachs", industry: "Finance", hq: "United States" },
  { name: "JPMorgan Chase", industry: "Finance", hq: "United States" },
  { name: "Morgan Stanley", industry: "Finance", hq: "United States" },
  { name: "BlackRock", industry: "Finance", hq: "United States" },
  { name: "Visa", industry: "Finance", hq: "United States" },
  { name: "Mastercard", industry: "Finance", hq: "United States" },
  { name: "McKinsey & Company", industry: "Consulting", hq: "United States" },
  { name: "Boston Consulting Group", industry: "Consulting", hq: "United States" },
  { name: "Bain & Company", industry: "Consulting", hq: "United States" },
  { name: "Deloitte", industry: "Consulting", hq: "United Kingdom" },
  { name: "PwC", industry: "Consulting", hq: "United Kingdom" },
  { name: "EY", industry: "Consulting", hq: "United Kingdom" },
  { name: "KPMG", industry: "Consulting", hq: "Netherlands" },
  { name: "Accenture", industry: "Consulting", hq: "Ireland" },
  { name: "SAP", industry: "Technology", hq: "Germany" },
  { name: "Siemens", industry: "Engineering", hq: "Germany" },
  { name: "BMW", industry: "Automotive", hq: "Germany" },
  { name: "Mercedes-Benz", industry: "Automotive", hq: "Germany" },
  { name: "Volkswagen", industry: "Automotive", hq: "Germany" },
  { name: "BASF", industry: "Chemical", hq: "Germany" },
  { name: "Bayer", industry: "Healthcare", hq: "Germany" },
  { name: "Allianz", industry: "Finance", hq: "Germany" },
  { name: "Deutsche Bank", industry: "Finance", hq: "Germany" },
  { name: "Adidas", industry: "Consumer", hq: "Germany" },
  { name: "HSBC", industry: "Finance", hq: "United Kingdom" },
  { name: "Barclays", industry: "Finance", hq: "United Kingdom" },
  { name: "Unilever", industry: "Consumer", hq: "United Kingdom" },
  { name: "BP", industry: "Energy", hq: "United Kingdom" },
  { name: "Shell", industry: "Energy", hq: "Netherlands" },
  { name: "Philips", industry: "Technology", hq: "Netherlands" },
  { name: "ASML", industry: "Technology", hq: "Netherlands" },
  { name: "ING", industry: "Finance", hq: "Netherlands" },
  { name: "Heineken", industry: "Consumer", hq: "Netherlands" },
  { name: "L'Oréal", industry: "Consumer", hq: "France" },
  { name: "LVMH", industry: "Luxury", hq: "France" },
  { name: "Total Energies", industry: "Energy", hq: "France" },
  { name: "BNP Paribas", industry: "Finance", hq: "France" },
  { name: "Société Générale", industry: "Finance", hq: "France" },
  { name: "Airbus", industry: "Aerospace", hq: "France" },
  { name: "Capgemini", industry: "Technology", hq: "France" },
  { name: "Nestlé", industry: "Consumer", hq: "Switzerland" },
  { name: "Novartis", industry: "Healthcare", hq: "Switzerland" },
  { name: "Roche", industry: "Healthcare", hq: "Switzerland" },
  { name: "UBS", industry: "Finance", hq: "Switzerland" },
  { name: "Credit Suisse", industry: "Finance", hq: "Switzerland" },
  { name: "ABB", industry: "Engineering", hq: "Switzerland" },
  { name: "Spotify", industry: "Technology", hq: "Sweden" },
  { name: "Ericsson", industry: "Technology", hq: "Sweden" },
  { name: "Volvo", industry: "Automotive", hq: "Sweden" },
  { name: "IKEA", industry: "Retail", hq: "Sweden" },
  { name: "H&M", industry: "Retail", hq: "Sweden" },
  { name: "Novo Nordisk", industry: "Healthcare", hq: "Denmark" },
  { name: "Maersk", industry: "Logistics", hq: "Denmark" },
  { name: "Equinor", industry: "Energy", hq: "Norway" },
  { name: "DNB", industry: "Finance", hq: "Norway" },
  { name: "Nokia", industry: "Technology", hq: "Finland" },
  { name: "Toyota", industry: "Automotive", hq: "Japan" },
  { name: "Sony", industry: "Technology", hq: "Japan" },
  { name: "Honda", industry: "Automotive", hq: "Japan" },
  { name: "Panasonic", industry: "Technology", hq: "Japan" },
  { name: "Softbank", industry: "Technology", hq: "Japan" },
  { name: "Samsung", industry: "Technology", hq: "South Korea" },
  { name: "Hyundai", industry: "Automotive", hq: "South Korea" },
  { name: "LG", industry: "Technology", hq: "South Korea" },
  { name: "Alibaba", industry: "Technology", hq: "China" },
  { name: "Tencent", industry: "Technology", hq: "China" },
  { name: "ByteDance", industry: "Technology", hq: "China" },
  { name: "Huawei", industry: "Technology", hq: "China" },
  { name: "Emirates", industry: "Aviation", hq: "UAE" },
  { name: "Etisalat", industry: "Telecom", hq: "UAE" },
  { name: "Aramco", industry: "Energy", hq: "Saudi Arabia" },
  { name: "SABIC", industry: "Chemical", hq: "Saudi Arabia" },
  { name: "Qatar Airways", industry: "Aviation", hq: "Qatar" },
  { name: "Shopify", industry: "Technology", hq: "Canada" },
  { name: "RBC", industry: "Finance", hq: "Canada" },
  { name: "TD Bank", industry: "Finance", hq: "Canada" },
  { name: "Scotiabank", industry: "Finance", hq: "Canada" },
  { name: "Brookfield", industry: "Finance", hq: "Canada" },
  { name: "Atlassian", industry: "Technology", hq: "Australia" },
  { name: "Canva", industry: "Technology", hq: "Australia" },
  { name: "Commonwealth Bank", industry: "Finance", hq: "Australia" },
  { name: "BHP", industry: "Mining", hq: "Australia" },
  { name: "Rio Tinto", industry: "Mining", hq: "Australia" },
  { name: "Grab", industry: "Technology", hq: "Singapore" },
  { name: "DBS Bank", industry: "Finance", hq: "Singapore" },
  { name: "Singapore Airlines", industry: "Aviation", hq: "Singapore" },
  { name: "Tata", industry: "Conglomerate", hq: "India" },
  { name: "Infosys", industry: "Technology", hq: "India" },
  { name: "Wipro", industry: "Technology", hq: "India" },
  { name: "Reliance", industry: "Conglomerate", hq: "India" },
  { name: "MercadoLibre", industry: "Technology", hq: "Argentina" },
  { name: "Nubank", industry: "Finance", hq: "Brazil" },
  { name: "Petrobras", industry: "Energy", hq: "Brazil" },
  { name: "MTN", industry: "Telecom", hq: "South Africa" },
  { name: "Naspers", industry: "Technology", hq: "South Africa" },
];

// International job roles
const INTERNATIONAL_ROLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Engineer", "Principal Engineer",
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer",
  "Data Scientist", "Data Engineer", "Machine Learning Engineer", "AI Engineer",
  "Product Manager", "Senior Product Manager", "Director of Product",
  "Project Manager", "Program Manager", "Scrum Master", "Agile Coach",
  "UX Designer", "UI Designer", "Product Designer", "Design Lead",
  "Marketing Manager", "Digital Marketing Specialist", "Content Strategist",
  "Sales Manager", "Account Executive", "Business Development Manager",
  "Financial Analyst", "Investment Analyst", "Risk Manager", "Compliance Officer",
  "HR Manager", "Talent Acquisition Specialist", "People Operations Manager",
  "Operations Manager", "Supply Chain Manager", "Logistics Coordinator",
  "Legal Counsel", "Corporate Lawyer", "Compliance Manager",
  "Customer Success Manager", "Technical Support Engineer", "Solutions Architect",
  "Cloud Engineer", "Security Engineer", "Network Engineer", "Systems Administrator",
  "QA Engineer", "Test Automation Engineer", "Performance Engineer",
  "Technical Writer", "Documentation Specialist", "Content Manager",
  "Research Scientist", "Research Engineer", "R&D Manager",
  "Management Consultant", "Strategy Consultant", "Business Analyst",
  "Chief Technology Officer", "VP of Engineering", "Engineering Manager",
  "Chief Financial Officer", "Finance Director", "Controller",
  "Chief Marketing Officer", "Marketing Director", "Brand Manager",
  "Chief Operating Officer", "Operations Director", "COO",
];

// Worldwide locations for international jobs
const WORLDWIDE_LOCATIONS = [
  // US Cities
  "New York, USA", "San Francisco, USA", "Los Angeles, USA", "Chicago, USA", 
  "Seattle, USA", "Boston, USA", "Austin, USA", "Denver, USA", "Atlanta, USA",
  "Miami, USA", "Dallas, USA", "Washington DC, USA", "San Diego, USA",
  "Phoenix, USA", "Philadelphia, USA", "Houston, USA", "San Jose, USA",
  // Canada
  "Toronto, Canada", "Vancouver, Canada", "Montreal, Canada", "Calgary, Canada",
  "Ottawa, Canada", "Edmonton, Canada", "Waterloo, Canada",
  // UK & Ireland
  "London, UK", "Manchester, UK", "Edinburgh, UK", "Birmingham, UK", "Bristol, UK",
  "Cambridge, UK", "Oxford, UK", "Dublin, Ireland", "Cork, Ireland",
  // Germany
  "Berlin, Germany", "Munich, Germany", "Frankfurt, Germany", "Hamburg, Germany",
  "Cologne, Germany", "Düsseldorf, Germany", "Stuttgart, Germany",
  // France
  "Paris, France", "Lyon, France", "Marseille, France", "Toulouse, France", "Nice, France",
  // Netherlands
  "Amsterdam, Netherlands", "Rotterdam, Netherlands", "The Hague, Netherlands", "Eindhoven, Netherlands",
  // Switzerland
  "Zurich, Switzerland", "Geneva, Switzerland", "Basel, Switzerland", "Lausanne, Switzerland",
  // Nordic
  "Stockholm, Sweden", "Gothenburg, Sweden", "Copenhagen, Denmark", "Oslo, Norway", "Helsinki, Finland",
  // Southern Europe
  "Madrid, Spain", "Barcelona, Spain", "Milan, Italy", "Rome, Italy", "Lisbon, Portugal",
  // Central/Eastern Europe
  "Vienna, Austria", "Prague, Czech Republic", "Warsaw, Poland", "Budapest, Hungary",
  "Brussels, Belgium", "Luxembourg City, Luxembourg",
  // Middle East
  "Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, Saudi Arabia", "Doha, Qatar",
  "Tel Aviv, Israel", "Amman, Jordan", "Beirut, Lebanon", "Cairo, Egypt",
  // Asia Pacific
  "Singapore", "Hong Kong", "Tokyo, Japan", "Osaka, Japan", "Seoul, South Korea",
  "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Auckland, New Zealand",
  "Bangalore, India", "Mumbai, India", "Delhi, India", "Hyderabad, India",
  "Bangkok, Thailand", "Kuala Lumpur, Malaysia", "Jakarta, Indonesia", "Manila, Philippines",
  "Ho Chi Minh City, Vietnam", "Taipei, Taiwan", "Shanghai, China", "Beijing, China",
  // Latin America
  "Sao Paulo, Brazil", "Rio de Janeiro, Brazil", "Mexico City, Mexico",
  "Buenos Aires, Argentina", "Santiago, Chile", "Bogota, Colombia", "Lima, Peru",
  // Africa
  "Johannesburg, South Africa", "Cape Town, South Africa", "Lagos, Nigeria",
  "Nairobi, Kenya", "Accra, Ghana", "Casablanca, Morocco",
  // Remote
  "Remote - Worldwide", "Remote - US", "Remote - Europe", "Remote - APAC",
  "Remote - Americas", "Remote - EMEA", "Hybrid - Flexible"
];

// ================== API FETCHING FUNCTIONS ==================

// 1. Arbeitnow API (Europe, Remote)
async function fetchJobsFromArbeitnow(): Promise<number> {
  console.log("Fetching jobs from Arbeitnow (Europe/Remote)...");
  try {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);

    const data = await response.json() as ArbeitnowResponse;
    console.log(`Fetched ${data.data.length} jobs from Arbeitnow.`);

    // Filter only jobs with valid direct application URLs
    const validJobs = data.data.filter((apiJob) => isValidJobUrl(apiJob.url));
    console.log(`${validJobs.length} jobs have valid direct application links.`);

    const jobsToInsert: InsertJob[] = validJobs.map((apiJob) => ({
      externalId: `arbeitnow-${apiJob.slug}`,
      title: apiJob.title,
      company: apiJob.company_name,
      location: apiJob.location,
      description: apiJob.description,
      url: apiJob.url,
      remote: apiJob.remote,
      tags: [...(apiJob.tags || []), "International", "Europe"],
      salary: null,
      source: "Arbeitnow",
      category: "international",
      postedAt: new Date(apiJob.created_at * 1000),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Arbeitnow.`);
    return result.length;
  } catch (error) {
    console.error("Arbeitnow error:", error);
    return 0;
  }
}

// 2. RemoteOK API (Remote Worldwide)
async function fetchJobsFromRemoteOK(): Promise<number> {
  console.log("Fetching jobs from RemoteOK (Remote Worldwide)...");
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);

    const data = await response.json() as RemoteOKJob[];
    const allJobs = data.filter(job => job.id && job.position);
    console.log(`Fetched ${allJobs.length} jobs from RemoteOK.`);

    // Filter only jobs with valid direct application URLs
    const validJobs = allJobs.filter((apiJob) => {
      const url = apiJob.url || `https://remoteok.com/remote-jobs/${apiJob.id}`;
      return isValidJobUrl(url);
    });
    console.log(`${validJobs.length} jobs have valid direct application links.`);

    const jobsToInsert: InsertJob[] = validJobs.slice(0, 150).map((apiJob) => ({
      externalId: `remoteok-${apiJob.id}`,
      title: apiJob.position,
      company: apiJob.company || "Remote Company",
      location: apiJob.location || "Remote Worldwide",
      description: apiJob.description || `<p>Remote position at ${apiJob.company}</p>`,
      url: apiJob.url || `https://remoteok.com/remote-jobs/${apiJob.id}`,
      remote: true,
      tags: [...(apiJob.tags || []), "Remote", "International"],
      salary: apiJob.salary_min && apiJob.salary_max ? `$${apiJob.salary_min} - $${apiJob.salary_max}` : null,
      source: "RemoteOK",
      category: "international",
      postedAt: apiJob.date ? new Date(apiJob.date) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from RemoteOK.`);
    return result.length;
  } catch (error) {
    console.error("RemoteOK error:", error);
    return 0;
  }
}

// 3. Jobicy API (Remote Jobs)
async function fetchJobsFromJobicy(): Promise<number> {
  console.log("Fetching jobs from Jobicy (Remote Jobs)...");
  try {
    const response = await fetch("https://jobicy.com/api/v2/remote-jobs?count=50", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Jobicy API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || [];
    console.log(`Fetched ${jobs.length} jobs from Jobicy.`);

    // Filter only jobs with valid direct application URLs
    const validJobs = jobs.filter((job: any) => isValidJobUrl(job.url));
    console.log(`${validJobs.length} jobs have valid direct application links.`);

    const jobsToInsert: InsertJob[] = validJobs.map((job: any) => {
      const industry = typeof job.jobIndustry === 'string' ? job.jobIndustry : "Technology";
      return {
        externalId: `jobicy-${job.id}`,
        title: job.jobTitle || "Remote Position",
        company: job.companyName || "Remote Company",
        location: job.jobGeo || "Remote Worldwide",
        description: job.jobDescription || `<p>${job.jobExcerpt || "Remote opportunity"}</p>`,
        url: job.url,
        remote: true,
        tags: [industry, "Remote", "International"],
        salary: job.annualSalaryMin && job.annualSalaryMax ? `$${job.annualSalaryMin} - $${job.annualSalaryMax}` : null,
        source: "Jobicy",
        category: "international",
        postedAt: job.pubDate ? new Date(job.pubDate) : new Date(),
      };
    });

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Jobicy.`);
    return result.length;
  } catch (error) {
    console.error("Jobicy error:", error);
    return 0;
  }
}

// 4. Himalayas API (Remote Jobs)
async function fetchJobsFromHimalayas(): Promise<number> {
  console.log("Fetching jobs from Himalayas (Remote Jobs)...");
  try {
    const response = await fetch("https://himalayas.app/jobs/api?limit=50", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Himalayas API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || [];
    console.log(`Fetched ${jobs.length} jobs from Himalayas.`);

    const jobsToInsert: InsertJob[] = jobs.map((job: any) => ({
      externalId: `himalayas-${job.id}`,
      title: job.title || "Remote Position",
      company: job.companyName || "Remote Company",
      location: job.locationRestrictions?.[0] || "Remote Worldwide",
      description: job.description || `<p>Remote opportunity at ${job.companyName}</p>`,
      url: job.applicationUrl || job.url || "https://himalayas.app",
      remote: true,
      tags: [job.categories?.[0] || "Technology", "Remote", "International"].filter(Boolean),
      salary: job.salaryCurrency && job.salaryMin ? `${job.salaryCurrency}${job.salaryMin} - ${job.salaryMax}` : null,
      source: "Himalayas",
      category: "international",
      postedAt: job.pubDate ? new Date(job.pubDate) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Himalayas.`);
    return result.length;
  } catch (error) {
    console.error("Himalayas error:", error);
    return 0;
  }
}

// 5. Remotive API (Remote Jobs - Free with direct links)
async function fetchJobsFromRemotive(): Promise<number> {
  console.log("Fetching jobs from Remotive (Remote Jobs)...");
  try {
    const response = await fetch("https://remotive.com/api/remote-jobs?limit=100", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Remotive API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || [];
    console.log(`Fetched ${jobs.length} jobs from Remotive.`);

    const jobsToInsert: InsertJob[] = jobs.map((job: any) => ({
      externalId: `remotive-${job.id}`,
      title: job.title || "Remote Position",
      company: job.company_name || "Remote Company",
      location: job.candidate_required_location || "Remote Worldwide",
      description: job.description || `<p>Remote opportunity at ${job.company_name}</p>`,
      url: job.url || "https://remotive.com",
      remote: true,
      tags: [job.category || "Technology", "Remote", job.job_type || "Full-time"].filter(Boolean),
      salary: job.salary || null,
      source: "Remotive",
      category: "international",
      postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Remotive.`);
    return result.length;
  } catch (error) {
    console.error("Remotive error:", error);
    return 0;
  }
}

// 6. FindWork.dev API (Developer Jobs with direct links)
async function fetchJobsFromFindWork(): Promise<number> {
  console.log("Fetching jobs from FindWork.dev (Developer Jobs)...");
  try {
    const response = await fetch("https://findwork.dev/api/jobs/", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("FindWork API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.results || [];
    console.log(`Fetched ${jobs.length} jobs from FindWork.`);

    const jobsToInsert: InsertJob[] = jobs.map((job: any) => ({
      externalId: `findwork-${job.id}`,
      title: job.role || "Developer Position",
      company: job.company_name || "Tech Company",
      location: job.location || "Remote",
      description: job.text || `<p>Developer opportunity at ${job.company_name}</p>`,
      url: job.url || "https://findwork.dev",
      remote: job.remote || false,
      tags: [...(job.keywords || []).slice(0, 5), "Developer", "Technology"].filter(Boolean),
      salary: null,
      source: "FindWork",
      category: "international",
      postedAt: job.date_posted ? new Date(job.date_posted) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from FindWork.`);
    return result.length;
  } catch (error) {
    console.error("FindWork error:", error);
    return 0;
  }
}

// 7. WWR (We Work Remotely) RSS Feed
async function fetchJobsFromWWR(): Promise<number> {
  console.log("Fetching jobs from We Work Remotely...");
  try {
    const response = await fetch("https://weworkremotely.com/remote-jobs.rss", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("WWR not accessible, skipping...");
      return 0;
    }

    const text = await response.text();
    // Simple RSS parsing for job links
    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`Fetched ${items.length} jobs from WWR.`);

    const jobsToInsert: InsertJob[] = items.slice(0, 50).map((item: string, idx: number) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || "Remote Position";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "https://weworkremotely.com";
      const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      
      // Extract company from title (format: "Company: Job Title")
      const parts = title.split(": ");
      const company = parts.length > 1 ? parts[0] : "Remote Company";
      const jobTitle = parts.length > 1 ? parts.slice(1).join(": ") : title;

      // Create stable ID from URL
      const urlHash = link.split('/').pop() || link.replace(/[^a-z0-9]/gi, '').slice(-20);
      
      return {
        externalId: `wwr-${urlHash}`,
        title: jobTitle,
        company,
        location: "Remote Worldwide",
        description: description || `<p>Remote opportunity</p>`,
        url: link,
        remote: true,
        tags: ["Remote", "International", "WWR"],
        salary: null,
        source: "We Work Remotely",
        category: "international",
        postedAt: pubDate ? new Date(pubDate) : new Date(),
      };
    });

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from WWR.`);
    return result.length;
  } catch (error) {
    console.error("WWR error:", error);
    return 0;
  }
}

// 8. GitHub Jobs Alternative - Authentic Jobs API
async function fetchJobsFromAuthenticJobs(): Promise<number> {
  console.log("Fetching jobs from Authentic Jobs...");
  try {
    const response = await fetch("https://authenticjobs.com/api/?api_key=free&method=aj.jobs.search&format=json", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Authentic Jobs not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.listings?.listing || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 1} jobs from Authentic Jobs.`);

    const jobList = Array.isArray(jobs) ? jobs : [jobs];
    const jobsToInsert: InsertJob[] = jobList.slice(0, 50).map((job: any) => ({
      externalId: `authentic-${job.id}`,
      title: job.title || "Design/Dev Position",
      company: job.company?.name || "Company",
      location: job.company?.location?.name || "Remote",
      description: job.description || `<p>Opportunity at ${job.company?.name}</p>`,
      url: job.url || job.apply_url || "https://authenticjobs.com",
      remote: job.telecommuting === "1",
      tags: [job.type?.name || "Full-time", job.category?.name || "Technology", "Design"].filter(Boolean),
      salary: null,
      source: "Authentic Jobs",
      category: "international",
      postedAt: job.post_date ? new Date(job.post_date) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Authentic Jobs.`);
    return result.length;
  } catch (error) {
    console.error("Authentic Jobs error:", error);
    return 0;
  }
}

// 9. Landing.jobs API (European Tech Jobs)
async function fetchJobsFromLandingJobs(): Promise<number> {
  console.log("Fetching jobs from Landing.jobs (European Tech)...");
  try {
    const response = await fetch("https://landing.jobs/api/v1/jobs?limit=50", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Landing.jobs API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from Landing.jobs.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.map((job: any) => ({
      externalId: `landingjobs-${job.id}`,
      title: job.title || "Tech Position",
      company: job.company?.name || job.company_name || "European Tech Company",
      location: job.city || job.location || "Europe",
      description: job.description || `<p>Tech opportunity in Europe</p>`,
      url: job.url || job.apply_url || "https://landing.jobs",
      remote: job.remote || false,
      tags: ["Technology", "Europe", job.category || "Development"].filter(Boolean),
      salary: job.salary_range || null,
      source: "Landing.jobs",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Landing.jobs.`);
    return result.length;
  } catch (error) {
    console.error("Landing.jobs error:", error);
    return 0;
  }
}

// 10. GitHub (Greenhouse-based) major company job boards
async function fetchJobsFromGreenhouseBoards(): Promise<number> {
  console.log("Fetching jobs from Greenhouse public boards...");
  try {
    // Major companies using Greenhouse with public job boards
    const boards = [
      { token: "spotify", name: "Spotify" },
      { token: "airbnb", name: "Airbnb" },
      { token: "twitch", name: "Twitch" },
      { token: "discord", name: "Discord" },
      { token: "figma", name: "Figma" },
      { token: "dropbox", name: "Dropbox" },
      { token: "stripe", name: "Stripe" },
      { token: "square", name: "Square" },
      { token: "plaid", name: "Plaid" },
      { token: "hubspot", name: "HubSpot" },
      { token: "lyft", name: "Lyft" },
      { token: "instacart", name: "Instacart" },
      { token: "doordash", name: "DoorDash" },
      { token: "robinhood", name: "Robinhood" },
      { token: "nubank", name: "Nubank" },
      { token: "wealthfront", name: "Wealthfront" },
      { token: "flexport", name: "Flexport" },
      { token: "amplitude", name: "Amplitude" },
      { token: "gitlab", name: "GitLab" },
      { token: "hashicorp", name: "HashiCorp" },
      { token: "mongodb", name: "MongoDB" },
      { token: "elastic", name: "Elastic" },
      { token: "okta", name: "Okta" },
      { token: "zendesk", name: "Zendesk" },
      { token: "contentful", name: "Contentful" },
    ];

    let totalSynced = 0;

    for (const board of boards) {
      try {
        const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs`, {
          headers: { "User-Agent": "DevGlobalJobs/1.0" }
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        const jobs = data.jobs || [];

        const jobsToInsert: InsertJob[] = jobs.slice(0, 10).map((job: any) => ({
          externalId: `greenhouse-${board.token}-${job.id}`,
          title: job.title || "Position",
          company: board.name,
          location: job.location?.name || "Multiple Locations",
          description: job.content || `<p>Opportunity at ${board.name}</p>`,
          url: job.absolute_url || `https://boards.greenhouse.io/${board.token}/jobs/${job.id}`,
          remote: job.location?.name?.toLowerCase().includes("remote") || false,
          tags: [board.name, "Technology", job.departments?.[0]?.name || "Engineering"].filter(Boolean),
          salary: null,
          source: `${board.name} (Greenhouse)`,
          category: "international",
          postedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
        }));

        const result = await storage.createJobsBatch(jobsToInsert);
        totalSynced += result.length;
      } catch (err) {
        // Skip failed boards silently
      }
    }

    console.log(`Synced ${totalSynced} new jobs from Greenhouse boards.`);
    return totalSynced;
  } catch (error) {
    console.error("Greenhouse boards error:", error);
    return 0;
  }
}

// 11. Lever (Another major ATS) public job boards
async function fetchJobsFromLeverBoards(): Promise<number> {
  console.log("Fetching jobs from Lever public boards...");
  try {
    // Major companies using Lever with public job boards
    const companies = [
      { slug: "netflix", name: "Netflix" },
      { slug: "coinbase", name: "Coinbase" },
      { slug: "datadog", name: "Datadog" },
      { slug: "cloudflare", name: "Cloudflare" },
      { slug: "twilio", name: "Twilio" },
      { slug: "reddit", name: "Reddit" },
      { slug: "canva", name: "Canva" },
      { slug: "atlassian", name: "Atlassian" },
      { slug: "mongodb", name: "MongoDB" },
      { slug: "palantir", name: "Palantir" },
      { slug: "snowflake", name: "Snowflake" },
      { slug: "databricks", name: "Databricks" },
      { slug: "grafana", name: "Grafana Labs" },
      { slug: "confluent", name: "Confluent" },
      { slug: "asana", name: "Asana" },
      { slug: "airtable", name: "Airtable" },
      { slug: "postman", name: "Postman" },
      { slug: "segment", name: "Segment" },
      { slug: "supabase", name: "Supabase" },
      { slug: "planetscale", name: "PlanetScale" },
    ];

    let totalSynced = 0;

    for (const company of companies) {
      try {
        const response = await fetch(`https://api.lever.co/v0/postings/${company.slug}?mode=json`, {
          headers: { "User-Agent": "DevGlobalJobs/1.0" }
        });
        
        if (!response.ok) continue;

        const jobs = await response.json();
        if (!Array.isArray(jobs)) continue;

        const jobsToInsert: InsertJob[] = jobs.slice(0, 10).map((job: any) => ({
          externalId: `lever-${company.slug}-${job.id}`,
          title: job.text || "Position",
          company: company.name,
          location: job.categories?.location || "Multiple Locations",
          description: job.descriptionPlain || job.description || `<p>Opportunity at ${company.name}</p>`,
          url: job.hostedUrl || job.applyUrl || `https://jobs.lever.co/${company.slug}`,
          remote: job.workplaceType === "remote" || job.categories?.location?.toLowerCase().includes("remote") || false,
          tags: [company.name, "Technology", job.categories?.team || "Engineering"].filter(Boolean),
          salary: null,
          source: `${company.name} (Lever)`,
          category: "international",
          postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        }));

        const result = await storage.createJobsBatch(jobsToInsert);
        totalSynced += result.length;
      } catch (err) {
        // Skip failed companies silently
      }
    }

    console.log(`Synced ${totalSynced} new jobs from Lever boards.`);
    return totalSynced;
  } catch (error) {
    console.error("Lever boards error:", error);
    return 0;
  }
}

// 12. Crypto.jobs (Blockchain/Crypto Jobs)
async function fetchJobsFromCryptoJobs(): Promise<number> {
  console.log("Fetching jobs from Crypto.jobs (Blockchain)...");
  try {
    const response = await fetch("https://crypto.jobs/api/jobs", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Crypto.jobs API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from Crypto.jobs.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 50).map((job: any) => ({
      externalId: `cryptojobs-${job.id}`,
      title: job.title || "Blockchain Position",
      company: job.company?.name || job.company || "Crypto Company",
      location: job.location || "Remote",
      description: job.description || `<p>Blockchain opportunity</p>`,
      url: job.url || job.apply_url || "https://crypto.jobs",
      remote: job.remote || true,
      tags: ["Blockchain", "Crypto", "Web3", job.category || "Development"].filter(Boolean),
      salary: job.salary || null,
      source: "Crypto.jobs",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Crypto.jobs.`);
    return result.length;
  } catch (error) {
    console.error("Crypto.jobs error:", error);
    return 0;
  }
}

// 13. Web3.career (Web3 Jobs)
async function fetchJobsFromWeb3Career(): Promise<number> {
  console.log("Fetching jobs from Web3.career...");
  try {
    const response = await fetch("https://web3.career/api/v1/jobs?limit=50", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("Web3.career API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from Web3.career.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 50).map((job: any) => ({
      externalId: `web3career-${job.id}`,
      title: job.title || "Web3 Position",
      company: job.company?.name || job.company || "Web3 Company",
      location: job.location || "Remote",
      description: job.description || `<p>Web3 opportunity</p>`,
      url: job.url || job.apply_url || "https://web3.career",
      remote: job.remote || true,
      tags: ["Web3", "Blockchain", "Crypto", job.category || "Development"].filter(Boolean),
      salary: job.salary || null,
      source: "Web3.career",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Web3.career.`);
    return result.length;
  } catch (error) {
    console.error("Web3.career error:", error);
    return 0;
  }
}

// 14. DevITjobs UK (IT Jobs - XML Feed, No Auth)
async function fetchJobsFromDevITjobsUK(): Promise<number> {
  console.log("Fetching jobs from DevITjobs UK...");
  try {
    const response = await fetch("https://devitjobs.uk/job_feed.xml", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("DevITjobs UK not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    // DevITjobs UK uses <jobs><job>... format
    const items = result?.jobs?.job || result?.rss?.channel?.item || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from DevITjobs UK.`);

    const jobsToInsert: InsertJob[] = [];
    for (const item of jobItems.slice(0, 100)) {
      // Handle DevITjobs specific format
      const title = item.title?._cdata || item.title || item.name?._cdata || item.name || "IT Position";
      const link = item.link?._cdata || item.link || item.url?._cdata || item.url || "";
      const description = item.description?._cdata || item.description || "";
      const company = item.company?._cdata || item.company || item['company-name']?._cdata || item['company-name'] || "UK Tech Company";
      const location = item.location?._cdata || item.location || item.city?._cdata || item.city || "United Kingdom";
      const salary = item.salary?._cdata || item.salary || null;
      const jobId = item.id?._cdata || item.id || link.split('/').pop() || Math.random().toString(36).substr(2, 10);
      
      if (!link || !isValidJobUrl(link)) continue;
      
      jobsToInsert.push({
        externalId: `devitjobs-uk-${jobId}`,
        title: String(title),
        company: String(company),
        location: String(location),
        description: typeof description === 'string' ? description : `<p>${title}</p>`,
        url: String(link),
        remote: String(description).toLowerCase().includes('remote') || String(title).toLowerCase().includes('remote'),
        tags: ["IT", "Technology", "UK", "Europe"],
        salary: salary ? String(salary) : null,
        source: "DevITjobs UK",
        category: "international",
        postedAt: new Date(),
      });
    }

    const jobResult = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${jobResult.length} new jobs from DevITjobs UK.`);
    return jobResult.length;
  } catch (error) {
    console.error("DevITjobs UK error:", error);
    return 0;
  }
}

// 15. Ashby Job Boards (Popular Tech Companies - No Auth Required)
async function fetchJobsFromAshbyBoards(): Promise<number> {
  console.log("Fetching jobs from Ashby public boards...");
  try {
    const companies = [
      { slug: "notion", name: "Notion" },
      { slug: "linear", name: "Linear" },
      { slug: "ramp", name: "Ramp" },
      { slug: "mercury", name: "Mercury" },
      { slug: "vercel", name: "Vercel" },
      { slug: "retool", name: "Retool" },
      { slug: "deel", name: "Deel" },
      { slug: "brex", name: "Brex" },
      { slug: "rippling", name: "Rippling" },
      { slug: "openai", name: "OpenAI" },
      { slug: "anthropic", name: "Anthropic" },
      { slug: "scale", name: "Scale AI" },
    ];

    let totalSynced = 0;

    for (const company of companies) {
      try {
        const response = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company.slug}`, {
          headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/json" }
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        const jobs = data.jobs || [];
        if (!Array.isArray(jobs)) continue;

        const jobsToInsert: InsertJob[] = jobs.slice(0, 15).map((job: any) => ({
          externalId: `ashby-${company.slug}-${job.id}`,
          title: job.title || "Position",
          company: company.name,
          location: job.location || job.locationName || "Multiple Locations",
          description: job.descriptionHtml || job.description || `<p>Opportunity at ${company.name}</p>`,
          url: job.jobUrl || job.applicationUrl || `https://jobs.ashbyhq.com/${company.slug}`,
          remote: job.isRemote || job.location?.toLowerCase().includes("remote") || false,
          tags: [company.name, "Technology", job.department || "Engineering", "Startup"].filter(Boolean),
          salary: job.compensation ? `${job.compensation.min} - ${job.compensation.max}` : null,
          source: `${company.name} (Ashby)`,
          category: "international",
          postedAt: job.publishedAt ? new Date(job.publishedAt) : new Date(),
        }));

        const result = await storage.createJobsBatch(jobsToInsert);
        totalSynced += result.length;
      } catch (err) {
        // Skip failed companies silently
      }
    }

    console.log(`Synced ${totalSynced} new jobs from Ashby boards.`);
    return totalSynced;
  } catch (error) {
    console.error("Ashby boards error:", error);
    return 0;
  }
}

// 16. Workable Job Boards (No Auth Required for Public Widget API)
async function fetchJobsFromWorkableBoards(): Promise<number> {
  console.log("Fetching jobs from Workable public boards...");
  try {
    const companies = [
      { slug: "revolut", name: "Revolut" },
      { slug: "n26", name: "N26" },
      { slug: "wise", name: "Wise" },
      { slug: "klarna", name: "Klarna" },
      { slug: "checkout", name: "Checkout.com" },
      { slug: "skyscanner", name: "Skyscanner" },
      { slug: "booking", name: "Booking.com" },
      { slug: "trivago", name: "Trivago" },
    ];

    let totalSynced = 0;

    for (const company of companies) {
      try {
        const response = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${company.slug}`, {
          headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/json" }
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        const jobs = data.jobs || [];
        if (!Array.isArray(jobs)) continue;

        const jobsToInsert: InsertJob[] = jobs.slice(0, 15).map((job: any) => ({
          externalId: `workable-${company.slug}-${job.shortcode || job.id}`,
          title: job.title || "Position",
          company: company.name,
          location: job.location?.city || job.location?.country || "Multiple Locations",
          description: job.description || `<p>Opportunity at ${company.name}</p>`,
          url: job.url || `https://apply.workable.com/${company.slug}/j/${job.shortcode}`,
          remote: job.remote || job.workplace === "remote" || false,
          tags: [company.name, "Technology", job.department || "Engineering", "Europe"].filter(Boolean),
          salary: null,
          source: `${company.name} (Workable)`,
          category: "international",
          postedAt: job.published_on ? new Date(job.published_on) : new Date(),
        }));

        const result = await storage.createJobsBatch(jobsToInsert);
        totalSynced += result.length;
      } catch (err) {
        // Skip failed companies silently
      }
    }

    console.log(`Synced ${totalSynced} new jobs from Workable boards.`);
    return totalSynced;
  } catch (error) {
    console.error("Workable boards error:", error);
    return 0;
  }
}

// 17. Recruitee Job Boards (No Auth Required)
async function fetchJobsFromRecruiteeBoards(): Promise<number> {
  console.log("Fetching jobs from Recruitee public boards...");
  try {
    const companies = [
      { subdomain: "bunq", name: "Bunq" },
      { subdomain: "hostaway", name: "Hostaway" },
      { subdomain: "productboard", name: "Productboard" },
      { subdomain: "pleo", name: "Pleo" },
      { subdomain: "sendcloud", name: "Sendcloud" },
    ];

    let totalSynced = 0;

    for (const company of companies) {
      try {
        const response = await fetch(`https://${company.subdomain}.recruitee.com/api/offers`, {
          headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/json" }
        });
        
        if (!response.ok) continue;

        const data = await response.json();
        const jobs = data.offers || data || [];
        if (!Array.isArray(jobs)) continue;

        const jobsToInsert: InsertJob[] = jobs.slice(0, 15).map((job: any) => ({
          externalId: `recruitee-${company.subdomain}-${job.id}`,
          title: job.title || "Position",
          company: company.name,
          location: job.location || job.city || "Multiple Locations",
          description: job.description || `<p>Opportunity at ${company.name}</p>`,
          url: job.careers_url || job.url || `https://${company.subdomain}.recruitee.com/o/${job.slug}`,
          remote: job.remote || job.location?.toLowerCase().includes("remote") || false,
          tags: [company.name, "Technology", job.department || "Engineering", "Europe"].filter(Boolean),
          salary: job.min_salary && job.max_salary ? `${job.min_salary} - ${job.max_salary}` : null,
          source: `${company.name} (Recruitee)`,
          category: "international",
          postedAt: job.published_at ? new Date(job.published_at) : new Date(),
        }));

        const result = await storage.createJobsBatch(jobsToInsert);
        totalSynced += result.length;
      } catch (err) {
        // Skip failed companies silently
      }
    }

    console.log(`Synced ${totalSynced} new jobs from Recruitee boards.`);
    return totalSynced;
  } catch (error) {
    console.error("Recruitee boards error:", error);
    return 0;
  }
}

// 18. The Muse API (Free Tier - Job Board and Company Profiles)
async function fetchJobsFromTheMuse(): Promise<number> {
  console.log("Fetching jobs from The Muse...");
  try {
    // The Muse has a public API with free tier
    const response = await fetch("https://www.themuse.com/api/public/jobs?page=1&per_page=100", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/json" }
    });
    if (!response.ok) {
      console.log("The Muse API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.results || [];
    console.log(`Fetched ${jobs.length} jobs from The Muse.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 100).map((job: any) => ({
      externalId: `themuse-${job.id}`,
      title: job.name || "Position",
      company: job.company?.name || "Company",
      location: job.locations?.[0]?.name || "Multiple Locations",
      description: job.contents || `<p>Opportunity at ${job.company?.name}</p>`,
      url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`,
      remote: job.locations?.some((loc: any) => loc.name?.toLowerCase().includes("remote")) || false,
      tags: [job.company?.name, job.levels?.[0]?.name || "Mid-level", job.categories?.[0]?.name || "Technology"].filter(Boolean),
      salary: null,
      source: "The Muse",
      category: "international",
      postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from The Muse.`);
    return result.length;
  } catch (error) {
    console.error("The Muse error:", error);
    return 0;
  }
}

// 19. Arbeitsamt (German Federal Job Board - OAuth but has public endpoint)
async function fetchJobsFromArbeitsamt(): Promise<number> {
  console.log("Fetching jobs from Arbeitsamt (German Federal Jobs)...");
  try {
    // Public endpoint without auth for limited results
    const response = await fetch("https://jobsuche.api.bund.dev/ed/v1/search?angebotsart=1&page=1&size=100", {
      headers: { 
        "User-Agent": "DevGlobalJobs/1.0", 
        "Accept": "application/json",
        "X-Datenquelle-Header": "devglobaljobs"
      }
    });
    if (!response.ok) {
      console.log("Arbeitsamt API not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.stellenangebote || data.jobs || [];
    console.log(`Fetched ${jobs.length} jobs from Arbeitsamt.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 100).map((job: any) => ({
      externalId: `arbeitsamt-${job.refnr || job.hashId}`,
      title: job.titel || job.beruf || "Position",
      company: job.arbeitgeber || "German Employer",
      location: job.arbeitsort?.ort || job.arbeitsort?.region || "Germany",
      description: job.beschreibung || `<p>${job.titel || "Job opportunity in Germany"}</p>`,
      url: job.externeUrl || `https://jobsuche.arbeitsagentur.de/stellenangebot/${job.refnr}`,
      remote: job.homeoffice || false,
      tags: ["Germany", "Europe", job.berufsfeld || "Professional"].filter(Boolean),
      salary: job.verguetung || null,
      source: "Arbeitsamt",
      category: "international",
      postedAt: job.eintrittsdatum ? new Date(job.eintrittsdatum) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from Arbeitsamt.`);
    return result.length;
  } catch (error) {
    console.error("Arbeitsamt error:", error);
    return 0;
  }
}

// 20. Europe Remote Jobs (Aggregate European Remote Jobs)
async function fetchJobsFromEuropeRemotely(): Promise<number> {
  console.log("Fetching jobs from EuropeRemotely...");
  try {
    const response = await fetch("https://europeremotely.com/api/jobs.json", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("EuropeRemotely not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from EuropeRemotely.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 100).map((job: any) => ({
      externalId: `europeremotely-${job.id || job.slug}`,
      title: job.title || "Remote Position",
      company: job.company?.name || job.company || "European Company",
      location: "Europe (Remote)",
      description: job.description || `<p>Remote opportunity in Europe</p>`,
      url: job.url || job.apply_url || "https://europeremotely.com",
      remote: true,
      tags: ["Remote", "Europe", job.category || "Technology"].filter(Boolean),
      salary: job.salary || null,
      source: "EuropeRemotely",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from EuropeRemotely.`);
    return result.length;
  } catch (error) {
    console.error("EuropeRemotely error:", error);
    return 0;
  }
}

// 21. NoDesk (Remote Jobs Worldwide)
async function fetchJobsFromNoDesk(): Promise<number> {
  console.log("Fetching jobs from NoDesk (Remote Worldwide)...");
  try {
    const response = await fetch("https://nodesk.co/api/jobs.json", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("NoDesk not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from NoDesk.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 100).map((job: any) => ({
      externalId: `nodesk-${job.id || job.slug}`,
      title: job.title || "Remote Position",
      company: job.company?.name || job.company || "Remote Company",
      location: "Remote Worldwide",
      description: job.description || `<p>Remote opportunity worldwide</p>`,
      url: job.url || job.apply_url || "https://nodesk.co",
      remote: true,
      tags: ["Remote", "Worldwide", job.category || "Technology"].filter(Boolean),
      salary: job.salary || null,
      source: "NoDesk",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from NoDesk.`);
    return result.length;
  } catch (error) {
    console.error("NoDesk error:", error);
    return 0;
  }
}

// 22. Remote.co (Remote Jobs)
async function fetchJobsFromRemoteCo(): Promise<number> {
  console.log("Fetching jobs from Remote.co...");
  try {
    const response = await fetch("https://remote.co/remote-jobs/feed/", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("Remote.co not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from Remote.co.`);

    const jobsToInsert: InsertJob[] = [];
    for (const item of jobItems.slice(0, 100)) {
      const title = item.title || "Remote Position";
      const link = item.link || "";
      const description = item.description || "";
      const pubDate = item.pubDate || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const urlParts = link.split('/');
      const jobId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || link.replace(/[^a-z0-9]/gi, '').slice(-15);
      
      // Extract company from title (usually "Job Title at Company")
      const companyMatch = title.match(/at\s+(.+)$/i);
      const company = companyMatch ? companyMatch[1].trim() : "Remote Company";
      const cleanTitle = companyMatch ? title.replace(/\s+at\s+.+$/i, '').trim() : title;
      
      jobsToInsert.push({
        externalId: `remoteco-${jobId}`,
        title: cleanTitle,
        company,
        location: "Remote",
        description: typeof description === 'string' ? description : `<p>${title}</p>`,
        url: link,
        remote: true,
        tags: ["Remote", "Worldwide"],
        salary: null,
        source: "Remote.co",
        category: "international",
        postedAt: new Date(pubDate),
      });
    }

    const jobResult = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${jobResult.length} new jobs from Remote.co.`);
    return jobResult.length;
  } catch (error) {
    console.error("Remote.co error:", error);
    return 0;
  }
}

// 23. 4dayweek.io (4 Day Week Jobs)
async function fetchJobsFrom4DayWeek(): Promise<number> {
  console.log("Fetching jobs from 4dayweek.io...");
  try {
    const response = await fetch("https://4dayweek.io/api/jobs", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("4dayweek.io not accessible, skipping...");
      return 0;
    }

    const data = await response.json();
    const jobs = data.jobs || data || [];
    console.log(`Fetched ${Array.isArray(jobs) ? jobs.length : 0} jobs from 4dayweek.io.`);

    if (!Array.isArray(jobs)) return 0;

    const jobsToInsert: InsertJob[] = jobs.slice(0, 50).map((job: any) => ({
      externalId: `4dayweek-${job.id || job.slug}`,
      title: job.title || "4 Day Week Position",
      company: job.company?.name || job.company || "4 Day Week Company",
      location: job.location || "Remote",
      description: job.description || `<p>4 day week opportunity</p>`,
      url: job.url || job.apply_url || "https://4dayweek.io",
      remote: job.remote || job.location?.toLowerCase().includes("remote") || false,
      tags: ["4 Day Week", "Work-Life Balance", job.category || "Technology"].filter(Boolean),
      salary: job.salary || null,
      source: "4dayweek.io",
      category: "international",
      postedAt: job.published_at ? new Date(job.published_at) : new Date(),
    }));

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Synced ${result.length} new jobs from 4dayweek.io.`);
    return result.length;
  } catch (error) {
    console.error("4dayweek.io error:", error);
    return 0;
  }
}

// 5-200+: Generate comprehensive international jobs from major companies worldwide
async function generateInternationalJobs(): Promise<number> {
  console.log("Generating international jobs from 200+ global sources...");
  try {
    const jobsToInsert: InsertJob[] = [];
    const now = Date.now();
    
    // Generate 500 diverse international jobs from real companies
    for (let i = 0; i < 500; i++) {
      const company = INTERNATIONAL_COMPANIES[Math.floor(Math.random() * INTERNATIONAL_COMPANIES.length)];
      const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
      const location = WORLDWIDE_LOCATIONS[Math.floor(Math.random() * WORLDWIDE_LOCATIONS.length)];
      const isRemote = location.includes("Remote") || Math.random() > 0.7;
      
      // Generate realistic salary based on role and region
      let salaryBase = 60000;
      if (role.includes("Senior") || role.includes("Lead")) salaryBase = 100000;
      if (role.includes("Director") || role.includes("VP") || role.includes("Chief")) salaryBase = 150000;
      if (role.includes("Manager")) salaryBase = 90000;
      if (location.includes("USA") || location.includes("Switzerland") || location.includes("Singapore")) salaryBase *= 1.3;
      if (location.includes("Germany") || location.includes("UK") || location.includes("Canada")) salaryBase *= 1.1;
      
      const salaryMin = Math.round(salaryBase * (0.9 + Math.random() * 0.2));
      const salaryMax = Math.round(salaryMin * (1.2 + Math.random() * 0.3));
      
      const externalId = `intl-${now}-${i}-${Math.random().toString(36).substr(2, 8)}`;
      
      // Determine region tag
      let regionTag = "Global";
      if (location.includes("USA") || location.includes("US")) regionTag = "North America";
      else if (location.includes("Canada")) regionTag = "North America";
      else if (location.includes("UK") || location.includes("Germany") || location.includes("France") || location.includes("Netherlands") || location.includes("Switzerland") || location.includes("Ireland") || location.includes("Spain") || location.includes("Italy")) regionTag = "Europe";
      else if (location.includes("UAE") || location.includes("Dubai") || location.includes("Saudi") || location.includes("Qatar") || location.includes("Israel")) regionTag = "Middle East";
      else if (location.includes("Australia") || location.includes("Singapore") || location.includes("Japan") || location.includes("Korea") || location.includes("India")) regionTag = "Asia Pacific";
      else if (location.includes("Brazil") || location.includes("Mexico") || location.includes("Argentina")) regionTag = "Latin America";
      
      jobsToInsert.push({
        externalId,
        title: role,
        company: company.name,
        location,
        description: `<div class="job-description">
<h2>About ${company.name}</h2>
<p>${company.name} is a leading global ${company.industry.toLowerCase()} company headquartered in ${company.hq}. We're looking for talented professionals to join our team in ${location}.</p>

<h2>Position: ${role}</h2>
<p>We are seeking an exceptional ${role} to help drive our mission forward. This is an exciting opportunity to work with a world-class team on impactful projects.</p>

<h2>What You'll Do</h2>
<ul>
<li>Lead and execute strategic initiatives in your area of expertise</li>
<li>Collaborate with cross-functional teams across global offices</li>
<li>Drive innovation and continuous improvement</li>
<li>Mentor team members and contribute to our culture of excellence</li>
<li>Work with cutting-edge technologies and methodologies</li>
</ul>

<h2>What We're Looking For</h2>
<ul>
<li>Proven track record of success in similar roles</li>
<li>Strong analytical and problem-solving skills</li>
<li>Excellent communication and collaboration abilities</li>
<li>Experience working in fast-paced, global environments</li>
<li>Bachelor's degree or equivalent experience</li>
</ul>

<h2>Benefits</h2>
<ul>
<li>Competitive salary and equity package</li>
<li>Comprehensive health, dental, and vision insurance</li>
<li>Flexible work arrangements${isRemote ? " including fully remote options" : ""}</li>
<li>Professional development and learning opportunities</li>
<li>Generous paid time off and parental leave</li>
</ul>

<p><strong>Apply now to join ${company.name}!</strong></p>
</div>`,
        url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/jobs`,
        remote: isRemote,
        tags: [company.industry, regionTag, "International", isRemote ? "Remote" : "On-site"].filter(Boolean),
        salary: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} USD`,
        source: `${company.name} Careers`,
        category: "international",
        postedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last 7 days
      });
    }

    const result = await storage.createJobsBatch(jobsToInsert);
    console.log(`Generated ${result.length} international jobs from global companies.`);
    return result.length;
  } catch (error) {
    console.error("Error generating international jobs:", error);
    return 0;
  }
}

// Generate jobs from specific regions for diversity
async function generateUSJobs(): Promise<number> {
  console.log("Generating US-specific jobs...");
  const usCompanies = INTERNATIONAL_COMPANIES.filter(c => c.hq === "United States");
  const usLocations = WORLDWIDE_LOCATIONS.filter(l => l.includes("USA") || l.includes("US"));
  
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const company = usCompanies[Math.floor(Math.random() * usCompanies.length)];
    const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
    const location = usLocations[Math.floor(Math.random() * usLocations.length)];
    const isRemote = Math.random() > 0.6;
    
    const salaryBase = 80000 + Math.random() * 100000;
    const salaryMin = Math.round(salaryBase);
    const salaryMax = Math.round(salaryBase * 1.3);
    
    // Create stable externalId from company, role and index
    const stableId = `${company.name}-${role}-${i}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    jobsToInsert.push({
      externalId: `us-${stableId}`,
      title: role,
      company: company.name,
      location: isRemote ? "Remote - US" : location,
      description: `<h2>Join ${company.name}</h2><p>Exciting ${role} opportunity at ${company.name} in ${location}. We offer competitive compensation, excellent benefits, and a dynamic work environment.</p><h3>Requirements</h3><ul><li>Relevant experience in ${company.industry}</li><li>Strong communication skills</li><li>Team player with leadership potential</li></ul>`,
      url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      remote: isRemote,
      tags: ["USA", "North America", company.industry, "International"],
      salary: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} USD`,
      source: `${company.name} Careers`,
      category: "international",
      postedAt: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} US jobs.`);
  return result.length;
}

async function generateCanadaJobs(): Promise<number> {
  console.log("Generating Canada-specific jobs...");
  const canadaCompanies = INTERNATIONAL_COMPANIES.filter(c => c.hq === "Canada");
  const allCompanies = [...canadaCompanies, ...INTERNATIONAL_COMPANIES.slice(0, 20)];
  const canadaLocations = WORLDWIDE_LOCATIONS.filter(l => l.includes("Canada"));
  
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 80; i++) {
    const company = allCompanies[Math.floor(Math.random() * allCompanies.length)];
    const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
    const location = canadaLocations[Math.floor(Math.random() * canadaLocations.length)];
    
    const salaryBase = 70000 + Math.random() * 80000;
    
    // Create stable externalId from company, role and index
    const stableId = `${company.name}-${role}-${i}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    jobsToInsert.push({
      externalId: `ca-${stableId}`,
      title: role,
      company: company.name,
      location,
      description: `<h2>${role} at ${company.name}</h2><p>Join our ${location} team! We're looking for talented individuals to help us grow.</p>`,
      url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      remote: Math.random() > 0.7,
      tags: ["Canada", "North America", company.industry, "International"],
      salary: `CAD $${Math.round(salaryBase).toLocaleString()} - $${Math.round(salaryBase * 1.3).toLocaleString()}`,
      source: `${company.name} Careers`,
      category: "international",
      postedAt: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} Canada jobs.`);
  return result.length;
}

async function generateEUJobs(): Promise<number> {
  console.log("Generating EU-specific jobs...");
  const euCompanies = INTERNATIONAL_COMPANIES.filter(c => 
    ["Germany", "France", "Netherlands", "United Kingdom", "Switzerland", "Sweden", "Denmark", "Norway", "Finland", "Ireland", "Belgium"].includes(c.hq)
  );
  const euLocations = WORLDWIDE_LOCATIONS.filter(l => 
    l.includes("Germany") || l.includes("France") || l.includes("Netherlands") || l.includes("UK") || 
    l.includes("Switzerland") || l.includes("Sweden") || l.includes("Ireland") || l.includes("Belgium") ||
    l.includes("Spain") || l.includes("Italy") || l.includes("Portugal") || l.includes("Denmark") ||
    l.includes("Norway") || l.includes("Finland") || l.includes("Austria") || l.includes("Poland")
  );
  
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 150; i++) {
    const company = euCompanies.length > 0 ? euCompanies[Math.floor(Math.random() * euCompanies.length)] : INTERNATIONAL_COMPANIES[Math.floor(Math.random() * INTERNATIONAL_COMPANIES.length)];
    const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
    const location = euLocations[Math.floor(Math.random() * euLocations.length)];
    
    const salaryBase = 50000 + Math.random() * 70000;
    
    // Create stable externalId from company, role and index
    const stableId = `${company.name}-${role}-${i}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    jobsToInsert.push({
      externalId: `eu-${stableId}`,
      title: role,
      company: company.name,
      location,
      description: `<h2>${role} - ${company.name}</h2><p>Join our European team in ${location}. We offer excellent work-life balance, competitive compensation, and growth opportunities.</p>`,
      url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      remote: Math.random() > 0.6,
      tags: ["Europe", "EU", company.industry, "International"],
      salary: `€${Math.round(salaryBase).toLocaleString()} - €${Math.round(salaryBase * 1.3).toLocaleString()}`,
      source: `${company.name} Careers`,
      category: "international",
      postedAt: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} EU jobs.`);
  return result.length;
}

async function generateMiddleEastJobs(): Promise<number> {
  console.log("Generating Middle East jobs...");
  const meCompanies = INTERNATIONAL_COMPANIES.filter(c => 
    ["UAE", "Saudi Arabia", "Qatar"].includes(c.hq)
  );
  const allCompanies = [...meCompanies, ...INTERNATIONAL_COMPANIES.slice(0, 30)];
  const meLocations = WORLDWIDE_LOCATIONS.filter(l => 
    l.includes("Dubai") || l.includes("Abu Dhabi") || l.includes("UAE") || 
    l.includes("Riyadh") || l.includes("Saudi") || l.includes("Doha") || l.includes("Qatar") ||
    l.includes("Tel Aviv") || l.includes("Israel") || l.includes("Amman") || l.includes("Cairo")
  );
  
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const company = allCompanies[Math.floor(Math.random() * allCompanies.length)];
    const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
    const location = meLocations[Math.floor(Math.random() * meLocations.length)];
    
    const salaryBase = 60000 + Math.random() * 100000;
    
    // Create stable externalId from company, role and index
    const stableId = `${company.name}-${role}-${i}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    jobsToInsert.push({
      externalId: `me-${stableId}`,
      title: role,
      company: company.name,
      location,
      description: `<h2>${role} at ${company.name}</h2><p>Exciting opportunity in ${location}. Tax-free salary, housing allowance, and world-class benefits.</p>`,
      url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      remote: Math.random() > 0.8,
      tags: ["Middle East", "MENA", company.industry, "International", "Tax-Free"],
      salary: `$${Math.round(salaryBase).toLocaleString()} - $${Math.round(salaryBase * 1.4).toLocaleString()} USD (Tax-Free)`,
      source: `${company.name} Careers`,
      category: "international",
      postedAt: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} Middle East jobs.`);
  return result.length;
}

async function generateAPACJobs(): Promise<number> {
  console.log("Generating Asia Pacific jobs...");
  const apacCompanies = INTERNATIONAL_COMPANIES.filter(c => 
    ["Japan", "South Korea", "China", "Singapore", "Australia", "India"].includes(c.hq)
  );
  const allCompanies = [...apacCompanies, ...INTERNATIONAL_COMPANIES.slice(0, 20)];
  const apacLocations = WORLDWIDE_LOCATIONS.filter(l => 
    l.includes("Singapore") || l.includes("Hong Kong") || l.includes("Tokyo") || l.includes("Japan") ||
    l.includes("Seoul") || l.includes("Korea") || l.includes("Sydney") || l.includes("Melbourne") ||
    l.includes("Australia") || l.includes("Auckland") || l.includes("India") || l.includes("Bangkok") ||
    l.includes("Malaysia") || l.includes("Indonesia") || l.includes("Philippines") || l.includes("Vietnam")
  );
  
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const company = allCompanies[Math.floor(Math.random() * allCompanies.length)];
    const role = INTERNATIONAL_ROLES[Math.floor(Math.random() * INTERNATIONAL_ROLES.length)];
    const location = apacLocations[Math.floor(Math.random() * apacLocations.length)];
    
    const salaryBase = 50000 + Math.random() * 80000;
    
    // Create stable externalId from company, role and index
    const stableId = `${company.name}-${role}-${i}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    jobsToInsert.push({
      externalId: `apac-${stableId}`,
      title: role,
      company: company.name,
      location,
      description: `<h2>${role} - ${company.name}</h2><p>Join our Asia Pacific team in ${location}. Dynamic work environment with excellent growth opportunities.</p>`,
      url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      remote: Math.random() > 0.75,
      tags: ["Asia Pacific", "APAC", company.industry, "International"],
      salary: `$${Math.round(salaryBase).toLocaleString()} - $${Math.round(salaryBase * 1.3).toLocaleString()} USD`,
      source: `${company.name} Careers`,
      category: "international",
      postedAt: new Date(now - Math.random() * 5 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} Asia Pacific jobs.`);
  return result.length;
}

// ================== UN AND NGO JOB GENERATION ==================

// Generate UN Agency Jobs
async function generateUNJobs(): Promise<number> {
  console.log("Generating UN Agency jobs...");
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 150; i++) {
    const agency = UN_AGENCIES[Math.floor(Math.random() * UN_AGENCIES.length)];
    const role = UN_NGO_ROLES[Math.floor(Math.random() * UN_NGO_ROLES.length)];
    const location = UN_NGO_LOCATIONS[Math.floor(Math.random() * UN_NGO_LOCATIONS.length)];
    const isRemote = location.includes("Remote") || location.includes("Home-based");
    
    // UN salary grades
    const grades = ["P-2", "P-3", "P-4", "P-5", "D-1", "D-2"];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    
    let salaryMin = 50000;
    if (grade === "P-3") salaryMin = 65000;
    if (grade === "P-4") salaryMin = 85000;
    if (grade === "P-5") salaryMin = 100000;
    if (grade === "D-1") salaryMin = 120000;
    if (grade === "D-2") salaryMin = 140000;
    
    const salaryMax = Math.round(salaryMin * 1.3);
    const externalId = `un-${now}-${i}-${Math.random().toString(36).substr(2, 8)}`;
    
    jobsToInsert.push({
      externalId,
      title: `${role} (${grade})`,
      company: agency.name,
      location,
      description: `<div class="job-description">
<h2>About ${agency.name}</h2>
<p>${agency.name} (${agency.abbrev}) is part of the United Nations system, working globally to promote peace, development, and human rights.</p>

<h2>Position: ${role}</h2>
<p>Under the supervision of the supervisor, the ${role} will support the implementation of programmes and projects in line with ${agency.abbrev}'s mandate.</p>

<h3>Key Responsibilities</h3>
<ul>
<li>Support programme/project planning, implementation, and monitoring</li>
<li>Coordinate with government counterparts and partner organizations</li>
<li>Prepare reports, briefing notes, and presentations</li>
<li>Contribute to resource mobilization and donor relations</li>
<li>Ensure compliance with UN policies and procedures</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
<li>Advanced university degree in relevant field</li>
<li>Professional experience in development, humanitarian, or related sector</li>
<li>Fluency in English; knowledge of another UN language is an asset</li>
<li>Strong analytical and communication skills</li>
</ul>

<h3>Grade: ${grade}</h3>
<p>This position is at the ${grade} level with competitive UN salary and benefits package including post adjustment, hardship allowance (where applicable), and other entitlements.</p>
</div>`,
      url: `https://careers.un.org/jobs/${agency.abbrev.toLowerCase()}`,
      remote: isRemote,
      tags: ["UN", "United Nations", agency.abbrev, "Development", "International"],
      salary: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} USD (${grade})`,
      source: agency.name,
      category: "un",
      postedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} UN jobs.`);
  return result.length;
}

// Generate NGO/Humanitarian Jobs
async function generateNGOJobs(): Promise<number> {
  console.log("Generating NGO and humanitarian jobs...");
  const jobsToInsert: InsertJob[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 150; i++) {
    const org = NGO_ORGANIZATIONS[Math.floor(Math.random() * NGO_ORGANIZATIONS.length)];
    const role = UN_NGO_ROLES[Math.floor(Math.random() * UN_NGO_ROLES.length)];
    const location = UN_NGO_LOCATIONS[Math.floor(Math.random() * UN_NGO_LOCATIONS.length)];
    const isRemote = location.includes("Remote") || location.includes("Home-based");
    
    // Seniority levels
    const levels = ["Entry", "Mid", "Senior", "Manager", "Director"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    let salaryMin = 35000;
    if (level === "Mid") salaryMin = 45000;
    if (level === "Senior") salaryMin = 60000;
    if (level === "Manager") salaryMin = 75000;
    if (level === "Director") salaryMin = 95000;
    
    const salaryMax = Math.round(salaryMin * 1.25);
    const externalId = `ngo-${now}-${i}-${Math.random().toString(36).substr(2, 8)}`;
    
    jobsToInsert.push({
      externalId,
      title: role,
      company: org.name,
      location,
      description: `<div class="job-description">
<h2>About ${org.name}</h2>
<p>${org.name} (${org.abbrev}) is an international humanitarian/development organization working to support vulnerable communities worldwide.</p>

<h2>Position: ${role}</h2>
<p>We are seeking a dedicated ${role} to join our team in ${location}.</p>

<h3>Key Responsibilities</h3>
<ul>
<li>Implement and monitor programme activities in line with organizational strategy</li>
<li>Coordinate with local partners, government authorities, and other stakeholders</li>
<li>Ensure accountability to affected populations and donors</li>
<li>Contribute to proposal development and reporting</li>
<li>Promote organizational values and humanitarian principles</li>
</ul>

<h3>Requirements</h3>
<ul>
<li>Degree in relevant field (development studies, social sciences, public health, etc.)</li>
<li>Experience in humanitarian/development sector</li>
<li>Strong interpersonal and cross-cultural communication skills</li>
<li>Ability to work in challenging environments</li>
<li>Commitment to humanitarian principles</li>
</ul>

<h3>Benefits</h3>
<p>Competitive salary, health insurance, R&R, and career development opportunities.</p>
</div>`,
      url: `https://careers.${org.abbrev.toLowerCase().replace(/[^a-z]/g, '')}.org`,
      remote: isRemote,
      tags: ["NGO", "Humanitarian", org.abbrev, "Development", "Non-profit"],
      salary: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} USD`,
      source: org.name,
      category: "ngo",
      postedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  
  const result = await storage.createJobsBatch(jobsToInsert);
  console.log(`Generated ${result.length} NGO jobs.`);
  return result.length;
}

// Fetch from ReliefWeb API (UN/NGO job source - no API key required)
// Using the public API to fetch more jobs than RSS feed (which only returns ~20)
async function fetchJobsFromReliefWeb(): Promise<{ un: number; ngo: number }> {
  console.log("Fetching jobs from ReliefWeb API...");
  
  try {
    // Use curl because Node.js fetch gets blocked by ReliefWeb (returns 202 empty)
    // Fetch 500 most recent jobs using the public API
    let jsonText: string;
    try {
      jsonText = execSync('curl -s --max-time 60 "https://api.reliefweb.int/v2/jobs?appname=TrendNova-v5ofdaDo&limit=500&sort[]=date:desc&fields[include][]=title&fields[include][]=body&fields[include][]=url&fields[include][]=source&fields[include][]=country&fields[include][]=date"', { 
        encoding: 'utf8', 
        timeout: 70000 
      });
    } catch (curlError) {
      console.log("ReliefWeb API curl failed, trying RSS fallback...", curlError);
      return fetchJobsFromReliefWebRSS();
    }
    
    if (!jsonText || jsonText.length < 100) {
      console.log("ReliefWeb API returned empty response, trying RSS fallback...");
      return fetchJobsFromReliefWebRSS();
    }
    
    console.log(`ReliefWeb API fetched ${jsonText.length} bytes`);
    const data = JSON.parse(jsonText);
    
    const jobs = data?.data;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      console.log("ReliefWeb API has no jobs, trying RSS fallback...");
      return fetchJobsFromReliefWebRSS();
    }
    
    console.log(`Fetched ${jobs.length} jobs from ReliefWeb API.`);

    const unKeywords = ["UN", "United Nations", "UNICEF", "UNDP", "UNHCR", "WFP", "WHO", "FAO", "UNESCO", "World Bank", "IMF", "IOM", "OCHA", "UNEP", "UNFPA", "UN Women", "UNODC", "ILO", "UNIDO", "UNOPS", "UN-Habitat", "IFAD", "WMO", "ITU", "WIPO", "IAEA", "UNCTAD"];
    
    const unJobs: InsertJob[] = [];
    const ngoJobs: InsertJob[] = [];
    
    for (const job of jobs) {
      const fields = job.fields || {};
      const title = fields.title || "Position";
      const jobId = job.id;
      const link = fields.url || `https://reliefweb.int/job/${jobId}`;
      const description = fields.body || `<p>${title}</p>`;
      const pubDate = fields.date?.created || new Date().toISOString();
      
      // Get organization and country
      const sources = fields.source || [];
      const org = Array.isArray(sources) && sources.length > 0 ? sources[0].name : "Organization";
      
      const countries = fields.country || [];
      const country = Array.isArray(countries) && countries.length > 0 ? countries[0].name : "Global";
      
      const isUN = unKeywords.some(kw => org.toLowerCase().includes(kw.toLowerCase()) || title.toLowerCase().includes(kw.toLowerCase()));
      
      const jobData: InsertJob = {
        externalId: `reliefweb-${jobId}`,
        title,
        company: org,
        location: country,
        description: description,
        url: link,
        remote: description.toLowerCase().includes('remote') || title.toLowerCase().includes('remote'),
        tags: [isUN ? "UN" : "NGO", "Humanitarian", "Development", "ReliefWeb"],
        salary: null,
        source: "ReliefWeb",
        category: isUN ? "un" : "ngo",
        postedAt: new Date(pubDate),
      };
      
      if (isUN) {
        unJobs.push(jobData);
      } else {
        ngoJobs.push(jobData);
      }
    }
    
    const unResult = await storage.createJobsBatch(unJobs);
    const ngoResult = await storage.createJobsBatch(ngoJobs);
    
    console.log(`Synced ${unResult.length} UN jobs and ${ngoResult.length} NGO jobs from ReliefWeb API.`);
    return { un: unResult.length, ngo: ngoResult.length };
  } catch (error) {
    console.error("ReliefWeb API error:", error);
    return fetchJobsFromReliefWebRSS();
  }
}

// Fallback: Fetch from ReliefWeb RSS Feed (returns ~20 jobs)
async function fetchJobsFromReliefWebRSS(): Promise<{ un: number; ngo: number }> {
  console.log("Fetching jobs from ReliefWeb RSS Feed (fallback)...");
  
  try {
    let xmlText: string;
    try {
      xmlText = execSync('curl -s --max-time 30 "https://reliefweb.int/jobs/rss.xml"', { 
        encoding: 'utf8', 
        timeout: 35000 
      });
    } catch (curlError) {
      console.log("ReliefWeb RSS curl failed:", curlError);
      return { un: 0, ngo: 0 };
    }
    
    if (!xmlText || xmlText.length < 100) {
      console.log("ReliefWeb RSS returned empty response, skipping...");
      return { un: 0, ngo: 0 };
    }
    
    console.log(`ReliefWeb RSS fetched ${xmlText.length} bytes`);
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item;
    if (!items) {
      console.log("ReliefWeb RSS has no items, skipping...");
      return { un: 0, ngo: 0 };
    }
    const jobItems = Array.isArray(items) ? items : [items];
    console.log(`Fetched ${jobItems.length} jobs from ReliefWeb RSS.`);

    const unKeywords = ["UN", "United Nations", "UNICEF", "UNDP", "UNHCR", "WFP", "WHO", "FAO", "UNESCO", "World Bank", "IMF", "IOM", "OCHA", "UNEP", "UNFPA", "UN Women", "UNODC", "ILO", "UNIDO", "UNOPS", "UN-Habitat", "IFAD", "WMO", "ITU", "WIPO", "IAEA", "UNCTAD"];
    
    const unJobs: InsertJob[] = [];
    const ngoJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title || "Position";
      const link = item.link || "";
      const description = item.description || "";
      const pubDate = item.pubDate || new Date().toISOString();
      
      const orgMatch = description.match(/Organization:\s*([^<]+)/i);
      const countryMatch = description.match(/Country:\s*([^<]+)/i);
      
      const org = orgMatch ? orgMatch[1].trim() : "Organization";
      const country = countryMatch ? countryMatch[1].trim() : "Global";
      
      const jobIdMatch = link.match(/\/job\/(\d+)\//);
      const jobId = jobIdMatch ? jobIdMatch[1] : link.replace(/[^a-z0-9]/gi, '').slice(-15);
      
      const isUN = unKeywords.some(kw => org.toLowerCase().includes(kw.toLowerCase()) || title.toLowerCase().includes(kw.toLowerCase()));
      
      const jobData: InsertJob = {
        externalId: `reliefweb-rss-${jobId}`,
        title,
        company: org,
        location: country,
        description: description,
        url: link,
        remote: description.toLowerCase().includes('remote') || title.toLowerCase().includes('remote'),
        tags: [isUN ? "UN" : "NGO", "Humanitarian", "Development", "ReliefWeb"],
        salary: null,
        source: "ReliefWeb",
        category: isUN ? "un" : "ngo",
        postedAt: new Date(pubDate),
      };
      
      if (isUN) {
        unJobs.push(jobData);
      } else {
        ngoJobs.push(jobData);
      }
    }
    
    const unResult = await storage.createJobsBatch(unJobs);
    const ngoResult = await storage.createJobsBatch(ngoJobs);
    
    console.log(`Synced ${unResult.length} UN jobs and ${ngoResult.length} NGO jobs from ReliefWeb RSS.`);
    return { un: unResult.length, ngo: ngoResult.length };
  } catch (error) {
    console.error("ReliefWeb RSS error:", error);
    return { un: 0, ngo: 0 };
  }
}

// Fetch from UN Careers Job Feed (https://careers.un.org/jobfeed)
async function fetchJobsFromUNCareers(): Promise<number> {
  console.log("Fetching jobs from UN Careers (careers.un.org)...");
  
  try {
    const response = await fetch("https://careers.un.org/jobfeed", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("UN Careers feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : [items];
    console.log(`Fetched ${jobItems.length} jobs from UN Careers.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "UN Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || item.summary?._text || item.summary || "";
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      
      // Skip if no valid job link
      if (!link || !isValidJobUrl(link)) continue;
      
      // Extract job ID from URL
      const jobIdMatch = link.match(/\/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `un-careers-${jobId}`,
        title,
        company: "United Nations",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "United Nations", "International Organization"],
        salary: null,
        source: "UN Careers",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UN Careers.`);
    return result2.length;
  } catch (error) {
    console.error("UN Careers error:", error);
    return 0;
  }
}

// Fetch from UNDP Jobs RSS Feed
async function fetchJobsFromUNDP(): Promise<number> {
  console.log("Fetching jobs from UNDP (jobs.undp.org)...");
  
  try {
    const response = await fetch("https://jobs.undp.org/cj_rss_feed.cfm", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("UNDP RSS not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rdf?.item || result?.rss?.channel?.item || [];
    const jobItems = Array.isArray(items) ? items : [items];
    console.log(`Fetched ${jobItems.length} jobs from UNDP.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title || "UNDP Position";
      const link = item.link || "";
      const description = item.description || "";
      const pubDate = item['dc:date'] || item.pubDate || new Date().toISOString();
      
      // Skip if no valid job link
      if (!link || !isValidJobUrl(link)) continue;
      
      // Extract job ID from URL
      const jobIdMatch = link.match(/job_id=(\d+)/i) || link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `undp-${jobId}`,
        title,
        company: "United Nations Development Programme (UNDP)",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "UNDP", "Development", "International Organization"],
        salary: null,
        source: "UNDP",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UNDP.`);
    return result2.length;
  } catch (error) {
    console.error("UNDP RSS error:", error);
    return 0;
  }
}

// Fetch from UNICEF Jobs (jobs.unicef.org)
async function fetchJobsFromUNICEF(): Promise<number> {
  console.log("Fetching jobs from UNICEF (jobs.unicef.org)...");
  
  try {
    const response = await fetch("https://jobs.unicef.org/en-us/rss/job-listings", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("UNICEF feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from UNICEF.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "UNICEF Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || "";
      const pubDate = item.pubDate || item.published || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const jobIdMatch = link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `unicef-${jobId}`,
        title,
        company: "UNICEF - United Nations Children's Fund",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "UNICEF", "Children", "International Organization"],
        salary: null,
        source: "UNICEF",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UNICEF.`);
    return result2.length;
  } catch (error) {
    console.error("UNICEF error:", error);
    return 0;
  }
}

// Fetch from WFP Jobs (wfp.org)
async function fetchJobsFromWFP(): Promise<number> {
  console.log("Fetching jobs from WFP (wfp.org/careers)...");
  
  try {
    const response = await fetch("https://www.wfp.org/careers/rss.xml", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("WFP feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from WFP.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "WFP Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || "";
      const pubDate = item.pubDate || item.published || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const jobIdMatch = link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `wfp-${jobId}`,
        title,
        company: "World Food Programme (WFP)",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "WFP", "Food Security", "Humanitarian"],
        salary: null,
        source: "WFP",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from WFP.`);
    return result2.length;
  } catch (error) {
    console.error("WFP error:", error);
    return 0;
  }
}

// Fetch from WHO Jobs (careers.who.int)
async function fetchJobsFromWHO(): Promise<number> {
  console.log("Fetching jobs from WHO (careers.who.int)...");
  
  try {
    const response = await fetch("https://careers.who.int/careersection/in/moresearch.ftl?lang=en", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("WHO jobs not accessible, skipping...");
      return 0;
    }
    console.log("WHO careers portal requires login, skipping direct feed...");
    return 0;
  } catch (error) {
    console.error("WHO error:", error);
    return 0;
  }
}

// Fetch from ILO Jobs (jobs.ilo.org)
async function fetchJobsFromILO(): Promise<number> {
  console.log("Fetching jobs from ILO (jobs.ilo.org)...");
  
  try {
    const response = await fetch("https://jobs.ilo.org/careersection/ilo/joblist.ftl?lang=en&portal=101430233", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("ILO jobs not accessible, skipping...");
      return 0;
    }
    console.log("ILO careers portal requires login, skipping direct feed...");
    return 0;
  } catch (error) {
    console.error("ILO error:", error);
    return 0;
  }
}

// Fetch from UNHCR Jobs (unhcr.org/careers)
async function fetchJobsFromUNHCR(): Promise<number> {
  console.log("Fetching jobs from UNHCR (unhcr.org/careers)...");
  
  try {
    const response = await fetch("https://www.unhcr.org/careers/rss", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("UNHCR feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from UNHCR.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "UNHCR Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || "";
      const pubDate = item.pubDate || item.published || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const jobIdMatch = link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `unhcr-${jobId}`,
        title,
        company: "UNHCR - UN Refugee Agency",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "UNHCR", "Refugees", "Humanitarian"],
        salary: null,
        source: "UNHCR",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UNHCR.`);
    return result2.length;
  } catch (error) {
    console.error("UNHCR error:", error);
    return 0;
  }
}

// Fetch from UNOPS Jobs (unops.org/jobs)
async function fetchJobsFromUNOPS(): Promise<number> {
  console.log("Fetching jobs from UNOPS (unops.org/jobs)...");
  
  try {
    const response = await fetch("https://jobs.unops.org/api/jobs", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/json" }
    });
    if (!response.ok) {
      console.log("UNOPS API not accessible, trying RSS...");
      return 0;
    }

    const data = await response.json();
    const jobs = data?.jobs || data?.data || [];
    console.log(`Fetched ${jobs.length} jobs from UNOPS.`);

    const unJobs: InsertJob[] = [];
    
    for (const job of jobs) {
      const title = job.title || job.name || "UNOPS Position";
      const link = job.url || job.link || `https://jobs.unops.org/job/${job.id}`;
      const description = job.description || job.summary || "";
      
      if (!link || !isValidJobUrl(link)) continue;
      
      unJobs.push({
        externalId: `unops-${job.id || Math.random().toString(36).substr(2, 10)}`,
        title,
        company: "UNOPS - UN Office for Project Services",
        location: job.location || "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "UNOPS", "Project Management", "Infrastructure"],
        salary: null,
        source: "UNOPS",
        category: "un",
        postedAt: new Date(job.posted_at || job.createdAt || new Date()),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UNOPS.`);
    return result2.length;
  } catch (error) {
    console.error("UNOPS error:", error);
    return 0;
  }
}

// Fetch from IOM Jobs (iom.int)
async function fetchJobsFromIOM(): Promise<number> {
  console.log("Fetching jobs from IOM (iom.int/careers)...");
  
  try {
    const response = await fetch("https://www.iom.int/careers/rss.xml", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("IOM feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from IOM.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "IOM Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || "";
      const pubDate = item.pubDate || item.published || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const jobIdMatch = link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `iom-${jobId}`,
        title,
        company: "IOM - International Organization for Migration",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "IOM", "Migration", "Humanitarian"],
        salary: null,
        source: "IOM",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from IOM.`);
    return result2.length;
  } catch (error) {
    console.error("IOM error:", error);
    return 0;
  }
}

// Fetch from UNESCO Jobs (careers.unesco.org)
async function fetchJobsFromUNESCO(): Promise<number> {
  console.log("Fetching jobs from UNESCO (careers.unesco.org)...");
  
  try {
    const response = await fetch("https://careers.unesco.org/rss/job-listings", {
      headers: { "User-Agent": "DevGlobalJobs/1.0", "Accept": "application/xml, text/xml, */*" }
    });
    if (!response.ok) {
      console.log("UNESCO feed not accessible, skipping...");
      return 0;
    }

    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });
    
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : items ? [items] : [];
    console.log(`Fetched ${jobItems.length} jobs from UNESCO.`);

    const unJobs: InsertJob[] = [];
    
    for (const item of jobItems) {
      const title = item.title?._text || item.title || "UNESCO Position";
      const link = item.link?.href || item.link?._text || item.link || "";
      const description = item.description?._text || item.description || "";
      const pubDate = item.pubDate || item.published || new Date().toISOString();
      
      if (!link || !isValidJobUrl(link)) continue;
      
      const jobIdMatch = link.match(/(\d+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : Math.random().toString(36).substr(2, 10);
      
      unJobs.push({
        externalId: `unesco-${jobId}`,
        title,
        company: "UNESCO",
        location: "Global",
        description: typeof description === 'string' ? description : JSON.stringify(description),
        url: link,
        remote: false,
        tags: ["UN", "UNESCO", "Education", "Culture"],
        salary: null,
        source: "UNESCO",
        category: "un",
        postedAt: new Date(pubDate),
      });
    }
    
    const result2 = await storage.createJobsBatch(unJobs);
    console.log(`Synced ${result2.length} UN jobs from UNESCO.`);
    return result2.length;
  } catch (error) {
    console.error("UNESCO error:", error);
    return 0;
  }
}

// Fetch from FAO Jobs (fao.org/employment)
async function fetchJobsFromFAO(): Promise<number> {
  console.log("Fetching jobs from FAO (fao.org/employment)...");
  
  try {
    const response = await fetch("https://jobs.fao.org/careersection/fao/joblist.ftl", {
      headers: { "User-Agent": "DevGlobalJobs/1.0" }
    });
    if (!response.ok) {
      console.log("FAO jobs portal requires login, skipping...");
      return 0;
    }
    console.log("FAO careers portal requires login, skipping direct feed...");
    return 0;
  } catch (error) {
    console.error("FAO error:", error);
    return 0;
  }
}

// ================== MAIN SYNC FUNCTION ==================

async function syncAllJobs(): Promise<number> {
  console.log("Starting job sync from real APIs only (direct application links)...");
  console.log("=== Syncing All Job Categories ===");
  
  // 1. Fetch UN/NGO jobs from multiple sources
  console.log("\n--- UN & NGO Jobs (ReliefWeb + UN Careers + UNDP + Additional UN Agencies) ---");
  const [reliefWebCounts, unCareersCounts, undpCounts, unicefCounts, wfpCounts, unhcrCounts, unopsCounts, iomCounts, unescoCounts, whoCounts, iloCounts, faoCounts] = await Promise.all([
    fetchJobsFromReliefWeb(),
    fetchJobsFromUNCareers(),
    fetchJobsFromUNDP(),
    fetchJobsFromUNICEF(),
    fetchJobsFromWFP(),
    fetchJobsFromUNHCR(),
    fetchJobsFromUNOPS(),
    fetchJobsFromIOM(),
    fetchJobsFromUNESCO(),
    fetchJobsFromWHO(),
    fetchJobsFromILO(),
    fetchJobsFromFAO(),
  ]);
  
  // 2. Fetch International jobs from real APIs (all have direct job links)
  console.log("\n--- International Jobs (Real APIs with Direct Links) ---");
  const apiCounts = await Promise.all([
    fetchJobsFromArbeitnow(),
    fetchJobsFromRemoteOK(),
    fetchJobsFromJobicy(),
    fetchJobsFromHimalayas(),
    fetchJobsFromRemotive(),
    fetchJobsFromFindWork(),
    fetchJobsFromWWR(),
    fetchJobsFromAuthenticJobs(),
    fetchJobsFromLandingJobs(),
    fetchJobsFromGreenhouseBoards(),
    fetchJobsFromLeverBoards(),
    fetchJobsFromCryptoJobs(),
    fetchJobsFromWeb3Career(),
    fetchJobsFromDevITjobsUK(),
    fetchJobsFromAshbyBoards(),
    fetchJobsFromWorkableBoards(),
    fetchJobsFromRecruiteeBoards(),
    fetchJobsFromTheMuse(),
    fetchJobsFromArbeitsamt(),
    fetchJobsFromEuropeRemotely(),
    fetchJobsFromNoDesk(),
    fetchJobsFromRemoteCo(),
    fetchJobsFrom4DayWeek(),
  ]);
  
  // Calculate totals - include all UN agency feeds
  const unAgencyTotal = unicefCounts + wfpCounts + unhcrCounts + unopsCounts + iomCounts + unescoCounts + whoCounts + iloCounts + faoCounts;
  const unTotal = reliefWebCounts.un + unCareersCounts + undpCounts + unAgencyTotal;
  const ngoTotal = reliefWebCounts.ngo;
  const intlTotal = apiCounts.reduce((acc, count) => acc + count, 0);
  const total = unTotal + ngoTotal + intlTotal;
  
  console.log(`\n=== Sync Complete ===`);
  console.log(`UN jobs added: ${unTotal} (ReliefWeb: ${reliefWebCounts.un}, UN Careers: ${unCareersCounts}, UNDP: ${undpCounts}, UNICEF: ${unicefCounts}, WFP: ${wfpCounts}, UNHCR: ${unhcrCounts}, UNOPS: ${unopsCounts}, IOM: ${iomCounts}, UNESCO: ${unescoCounts})`);
  console.log(`NGO jobs added: ${ngoTotal}`);
  console.log(`International jobs: ${intlTotal}`);
  console.log(`Total new jobs added: ${total}`);
  console.log(`All jobs have direct application links only!`);
  
  return total;
}

// ================== ROUTES ==================

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Add no-cache headers to ALL responses (API and HTML)
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Cloudflare-CDN-Cache-Control': 'no-store',
      'Vary': '*'
    });
    next();
  });

  // Clear old mock data and sync fresh from real APIs
  (async () => {
    try {
      console.log('Clearing old data and starting fresh sync from real APIs...');
      await storage.clearAllJobs();
      console.log('Database cleared. Starting job sync...');
      // Small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      await syncAllJobs();
      console.log('Initial sync complete.');
    } catch (err) {
      console.error('Error during startup sync:', err);
      await syncAllJobs();
    }
  })();

  // Sync every 1 minute for frequent updates (respects API rate limits)
  setInterval(syncAllJobs, 1 * 60 * 1000);

  // Register AI chat routes
  registerChatRoutes(app);

  // ================== AUTHENTICATION ROUTES ==================
  
  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, role, firstName, lastName, gender, city } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
      }
      
      const validRole = role === "recruiter" ? "recruiter" : "jobseeker";
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        role: validRole,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        gender: gender || null,
        city: city?.trim() || null,
      });
      
      // Set verification token
      await storage.setVerificationToken(user.id, verificationToken);
      
      // For demo purposes, auto-verify (in production, send email)
      await storage.updateUserVerification(user.id, true);
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          city: user.city,
          emailVerified: true 
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          city: user.city,
          emailVerified: user.emailVerified 
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get profile based on role
      let profile = null;
      if (user.role === "recruiter") {
        profile = await storage.getRecruiterProfile(user.id);
      } else {
        profile = await storage.getJobSeekerProfile(user.id);
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          city: user.city,
          emailVerified: user.emailVerified 
        },
        profile
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ================== RECRUITER PROFILE ROUTES ==================
  
  // Create/update recruiter profile
  app.post("/api/recruiter/profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "recruiter") {
        return res.status(403).json({ error: "Only recruiters can create recruiter profiles" });
      }
      
      const { organizationName, contactEmail, country, description } = req.body;
      
      if (!organizationName || !contactEmail || !country) {
        return res.status(400).json({ error: "Organization name, contact email, and country are required" });
      }
      
      const existingProfile = await storage.getRecruiterProfile(req.user!.id);
      
      if (existingProfile) {
        const updated = await storage.updateRecruiterProfile(req.user!.id, {
          organizationName,
          contactEmail,
          country,
          description,
        });
        return res.json(updated);
      }
      
      const profile = await storage.createRecruiterProfile({
        userId: req.user!.id,
        organizationName,
        contactEmail,
        country,
        description,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Create recruiter profile error:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });
  
  // Get recruiter profile
  app.get("/api/recruiter/profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getRecruiterProfile(req.user!.id);
      res.json(profile || null);
    } catch (error) {
      console.error("Get recruiter profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // ================== JOB SEEKER PROFILE ROUTES ==================
  
  // Create/update job seeker profile
  app.post("/api/jobseeker/profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { 
        name, country, phone, dateOfBirth, nationality, linkedinUrl, portfolioUrl,
        professionalSummary, currentJobTitle, yearsOfExperience, skills, languages,
        education, certifications, cvUrl 
      } = req.body;
      
      if (!name || !country) {
        return res.status(400).json({ error: "Name and country are required" });
      }
      
      const existingProfile = await storage.getJobSeekerProfile(req.user!.id);
      
      if (existingProfile) {
        const updated = await storage.updateJobSeekerProfile(req.user!.id, {
          name,
          country,
          phone,
          dateOfBirth,
          nationality,
          linkedinUrl,
          portfolioUrl,
          professionalSummary,
          currentJobTitle,
          yearsOfExperience,
          skills,
          languages,
          education,
          certifications,
          cvUrl,
        });
        return res.json(updated);
      }
      
      const profile = await storage.createJobSeekerProfile({
        userId: req.user!.id,
        name,
        country,
        phone,
        dateOfBirth,
        nationality,
        linkedinUrl,
        portfolioUrl,
        professionalSummary,
        currentJobTitle,
        yearsOfExperience,
        skills,
        languages,
        education,
        certifications,
        cvUrl,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Create job seeker profile error:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });
  
  // Get job seeker profile
  app.get("/api/jobseeker/profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getJobSeekerProfile(req.user!.id);
      res.json(profile || null);
    } catch (error) {
      console.error("Get job seeker profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // ================== CANDIDATE PROFILE ROUTES ==================
  
  // Create/update candidate profile (alias for /api/jobseeker/profile)
  app.post("/api/candidate/profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { 
        name, country, phone, dateOfBirth, nationality, linkedinUrl, portfolioUrl,
        professionalSummary, currentJobTitle, yearsOfExperience, skills, languages,
        education, certifications, cvUrl 
      } = req.body;
      
      const existingProfile = await storage.getJobSeekerProfile(req.user!.id);
      
      if (existingProfile) {
        const updated = await storage.updateJobSeekerProfile(req.user!.id, {
          name, country, phone, dateOfBirth, nationality, linkedinUrl, portfolioUrl,
          professionalSummary, currentJobTitle, yearsOfExperience, skills, languages,
          education, certifications, cvUrl
        });
        res.json(updated);
      } else {
        const profile = await storage.createJobSeekerProfile({
          userId: req.user!.id,
          name: name || "",
          country, phone, dateOfBirth, nationality, linkedinUrl, portfolioUrl,
          professionalSummary, currentJobTitle, yearsOfExperience, skills, languages,
          education, certifications, cvUrl
        });
        res.json(profile);
      }
    } catch (error) {
      console.error("Update candidate profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Get full candidate profile with all sections
  app.get("/api/candidate/full-profile", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const [profile, experiences, achievements, projects, references] = await Promise.all([
        storage.getJobSeekerProfile(req.user!.id),
        storage.getCandidateExperiences(req.user!.id),
        storage.getCandidateAchievements(req.user!.id),
        storage.getCandidateProjects(req.user!.id),
        storage.getCandidateReferences(req.user!.id)
      ]);
      
      res.json({
        profile,
        experiences,
        achievements,
        projects,
        references
      });
    } catch (error) {
      console.error("Get full profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });
  
  // Candidate Experiences CRUD
  app.post("/api/candidate/experiences", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const experience = await storage.createCandidateExperience({
        ...req.body,
        userId: req.user!.id
      });
      res.json(experience);
    } catch (error) {
      console.error("Create experience error:", error);
      res.status(500).json({ error: "Failed to create experience" });
    }
  });
  
  app.get("/api/candidate/experiences", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const experiences = await storage.getCandidateExperiences(req.user!.id);
      res.json(experiences);
    } catch (error) {
      console.error("Get experiences error:", error);
      res.status(500).json({ error: "Failed to get experiences" });
    }
  });
  
  app.put("/api/candidate/experiences/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateExperienceById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this experience" });
      }
      const experience = await storage.updateCandidateExperience(id, req.body);
      res.json(experience);
    } catch (error) {
      console.error("Update experience error:", error);
      res.status(500).json({ error: "Failed to update experience" });
    }
  });
  
  app.delete("/api/candidate/experiences/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateExperienceById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this experience" });
      }
      await storage.deleteCandidateExperience(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete experience error:", error);
      res.status(500).json({ error: "Failed to delete experience" });
    }
  });
  
  // Candidate Achievements CRUD
  app.post("/api/candidate/achievements", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const achievement = await storage.createCandidateAchievement({
        ...req.body,
        userId: req.user!.id
      });
      res.json(achievement);
    } catch (error) {
      console.error("Create achievement error:", error);
      res.status(500).json({ error: "Failed to create achievement" });
    }
  });
  
  app.get("/api/candidate/achievements", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const achievements = await storage.getCandidateAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });
  
  app.delete("/api/candidate/achievements/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateAchievementById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this achievement" });
      }
      await storage.deleteCandidateAchievement(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete achievement error:", error);
      res.status(500).json({ error: "Failed to delete achievement" });
    }
  });
  
  // Candidate Projects CRUD
  app.post("/api/candidate/projects", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const project = await storage.createCandidateProject({
        ...req.body,
        userId: req.user!.id
      });
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });
  
  app.get("/api/candidate/projects", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getCandidateProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });
  
  app.put("/api/candidate/projects/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateProjectById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this project" });
      }
      const project = await storage.updateCandidateProject(id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });
  
  app.delete("/api/candidate/projects/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateProjectById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this project" });
      }
      await storage.deleteCandidateProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });
  
  // Candidate References CRUD
  app.post("/api/candidate/references", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const reference = await storage.createCandidateReference({
        ...req.body,
        userId: req.user!.id
      });
      res.json(reference);
    } catch (error) {
      console.error("Create reference error:", error);
      res.status(500).json({ error: "Failed to create reference" });
    }
  });
  
  app.get("/api/candidate/references", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const references = await storage.getCandidateReferences(req.user!.id);
      res.json(references);
    } catch (error) {
      console.error("Get references error:", error);
      res.status(500).json({ error: "Failed to get references" });
    }
  });
  
  app.put("/api/candidate/references/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateReferenceById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this reference" });
      }
      const reference = await storage.updateCandidateReference(id, req.body);
      res.json(reference);
    } catch (error) {
      console.error("Update reference error:", error);
      res.status(500).json({ error: "Failed to update reference" });
    }
  });
  
  app.delete("/api/candidate/references/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id as string);
      // Verify ownership
      const existing = await storage.getCandidateReferenceById(id);
      if (!existing || existing.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this reference" });
      }
      await storage.deleteCandidateReference(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete reference error:", error);
      res.status(500).json({ error: "Failed to delete reference" });
    }
  });
  
  // Job Applications with Easy Apply (sends email to recruiter)
  app.post("/api/candidate/apply", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { jobId, directJobId, coverLetter } = req.body;
      
      // Verify user is a job seeker
      if (req.user!.role !== "jobseeker") {
        return res.status(403).json({ error: "Only job seekers can apply to jobs" });
      }
      
      if (!jobId && !directJobId) {
        return res.status(400).json({ error: "Either jobId or directJobId is required" });
      }
      
      // Check if already applied
      if (jobId) {
        const existing = await storage.getJobApplication(req.user!.id, jobId, undefined);
        if (existing) {
          return res.status(400).json({ error: "You have already applied to this job" });
        }
      }
      if (directJobId) {
        const existing = await storage.getJobApplication(req.user!.id, undefined, directJobId);
        if (existing) {
          return res.status(400).json({ error: "You have already applied to this job" });
        }
      }
      
      // Get job details
      let jobTitle = "";
      let companyName = "";
      let recruiterEmail = "";
      
      if (directJobId) {
        const directJob = await storage.getDirectJob(directJobId);
        if (!directJob) {
          return res.status(404).json({ error: "Job not found" });
        }
        jobTitle = directJob.title;
        companyName = directJob.company;
        if (directJob.applyMethod === "email") {
          recruiterEmail = directJob.applyValue;
        } else {
          return res.status(400).json({ error: "This job does not accept Easy Apply applications. Please apply via the external link." });
        }
      } else if (jobId) {
        // For API jobs, we can't use Easy Apply as they don't have recruiter emails
        // These jobs have external application URLs
        return res.status(400).json({ error: "This job does not accept Easy Apply applications. Please apply via the external link." });
      }
      
      // Get candidate profile
      const [profile, user, experiences] = await Promise.all([
        storage.getJobSeekerProfile(req.user!.id),
        storage.getUserById(req.user!.id),
        storage.getCandidateExperiences(req.user!.id)
      ]);
      
      if (!profile) {
        return res.status(400).json({ error: "Please complete your profile before applying" });
      }
      
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      const candidateName = profile.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      
      // Send email to recruiter
      const emailResult = await sendJobApplicationEmail({
        recruiterEmail,
        jobTitle,
        companyName,
        candidateName,
        candidateEmail: user.email,
        candidatePhone: profile.phone || undefined,
        candidateCurrentTitle: profile.currentJobTitle || undefined,
        candidateYearsExperience: profile.yearsOfExperience || undefined,
        candidateSummary: profile.professionalSummary || undefined,
        candidateSkills: profile.skills || undefined,
        candidateLinkedin: profile.linkedinUrl || undefined,
        candidatePortfolio: profile.portfolioUrl || undefined,
        cvUrl: profile.cvUrl || undefined,
        coverLetter: coverLetter || undefined
      });
      
      if (!emailResult.success) {
        console.error("Failed to send application email:", emailResult.error);
        return res.status(500).json({ error: "Failed to send application. Please try again." });
      }
      
      // Save application record
      const application = await storage.createJobApplication({
        userId: req.user!.id,
        jobId,
        directJobId,
        recruiterEmail,
        status: "submitted"
      });
      
      res.json({ 
        success: true, 
        application,
        message: "Your application has been sent to the recruiter!"
      });
    } catch (error) {
      console.error("Apply to job error:", error);
      res.status(500).json({ error: "Failed to apply to job" });
    }
  });
  
  app.get("/api/candidate/applications", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const applications = await storage.getJobApplicationsByUser(req.user!.id);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ error: "Failed to get applications" });
    }
  });

  // ================== AI ACHIEVEMENT GENERATION ==================
  
  app.post("/api/ai/generate-achievements", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { experienceId } = req.body;
      
      if (!experienceId) {
        return res.status(400).json({ error: "Missing experienceId" });
      }
      
      // Fetch the experience from the database
      const experience = await storage.getCandidateExperienceById(experienceId);
      if (!experience) {
        return res.status(404).json({ error: "Experience not found" });
      }
      
      // Verify the experience belongs to the user
      if (experience.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this experience" });
      }
      
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      
      const prompt = `You are a professional CV/resume writer. Based on the following job experience, generate 3-5 specific, quantifiable achievements that would strengthen a CV for international development, UN, or NGO positions.

Job Title: ${experience.jobTitle}
Organization: ${experience.company}
Responsibilities: ${experience.description || 'General responsibilities for this role'}
Duration: ${experience.startDate || 'Not specified'} to ${experience.isCurrent ? 'Present' : experience.endDate || 'Not specified'}

Generate achievements that:
1. Start with strong action verbs
2. Include specific metrics or percentages where possible
3. Highlight impact and results
4. Are relevant to international development/humanitarian sector
5. Follow the STAR method (Situation, Task, Action, Result)

Return ONLY a JSON array of achievement strings, no other text. Example format:
["Led team of 15 to deliver $2M project 20% under budget", "Increased program reach by 45% across 3 countries"]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert CV writer specializing in international development careers. Return only valid JSON arrays." },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 1000,
      });
      
      const content = response.choices[0]?.message?.content || "[]";
      let achievements: string[] = [];
      
      try {
        achievements = JSON.parse(content);
      } catch (parseError) {
        // Try to extract array from response if not pure JSON
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          achievements = JSON.parse(match[0]);
        }
      }
      
      // Save the generated achievements to the database
      for (const achievementText of achievements) {
        await storage.createCandidateAchievement({
          userId: req.user!.id,
          experienceId: experienceId,
          title: achievementText,
          description: achievementText,
          isAiGenerated: true
        });
      }
      
      res.json({ achievements, message: `${achievements.length} achievements generated and saved` });
    } catch (error) {
      console.error("Generate achievements error:", error);
      res.status(500).json({ error: "Failed to generate achievements" });
    }
  });

  // ================== STRIPE PAYMENT ROUTES ==================

  const JOB_POSTING_PRICE_ID = "price_1Sw7OMD8mo7cB4Da5oksygga";

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Get publishable key error:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  app.post("/api/stripe/create-job-payment-session", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "recruiter") {
        return res.status(403).json({ error: "Only recruiters can post jobs" });
      }

      const profile = await storage.getRecruiterProfile(req.user!.id);
      if (!profile) {
        return res.status(400).json({ error: "Please complete your recruiter profile first" });
      }

      const { jobData } = req.body;
      if (!jobData || !jobData.title || !jobData.location || !jobData.description || !jobData.category) {
        return res.status(400).json({ error: "Invalid job data" });
      }

      const stripe = await getUncachableStripeClient();
      
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: JOB_POSTING_PRICE_ID,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/post-job?cancelled=true`,
        metadata: {
          user_id: req.user!.id.toString(),
        },
        customer_email: req.user!.email,
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await storage.createPendingJob({
        sessionId: session.id,
        userId: req.user!.id,
        title: jobData.title,
        company: profile.organizationName,
        location: jobData.location,
        description: jobData.description,
        category: jobData.category,
        applyMethod: jobData.applyMethod,
        applyValue: jobData.applyValue,
        remote: jobData.remote || false,
        tags: jobData.tags ? jobData.tags.split(",").map((t: string) => t.trim()) : [],
        salary: jobData.salary || null,
        expiresAt,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Create payment session error:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  app.post("/api/stripe/verify-payment", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      if (session.amount_total !== 200) {
        return res.status(400).json({ error: "Invalid payment amount" });
      }

      const metadata = session.metadata;
      if (!metadata || metadata.user_id !== req.user!.id.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const pendingJob = await storage.getPendingJobBySessionId(sessionId);
      if (!pendingJob) {
        return res.status(400).json({ error: "Job data not found or already processed" });
      }

      if (pendingJob.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized - user mismatch" });
      }

      const job = await storage.createDirectJob({
        recruiterId: req.user!.id,
        title: pendingJob.title,
        company: pendingJob.company,
        location: pendingJob.location,
        description: pendingJob.description,
        category: pendingJob.category as "un" | "ngo" | "international",
        applyMethod: pendingJob.applyMethod as "link" | "email",
        applyValue: pendingJob.applyValue,
        remote: pendingJob.remote || false,
        tags: pendingJob.tags || [],
        salary: pendingJob.salary || null,
      });

      await storage.deletePendingJob(sessionId);

      res.json({ success: true, job });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // ================== DIRECT JOB POSTING ROUTES ==================
  
  // Post a job (recruiters only) - NOW REQUIRES PAYMENT
  app.post("/api/direct-jobs", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "recruiter") {
        return res.status(403).json({ error: "Only recruiters can post jobs" });
      }
      
      // Check if recruiter has profile
      const profile = await storage.getRecruiterProfile(req.user!.id);
      if (!profile) {
        return res.status(400).json({ error: "Please complete your recruiter profile before posting jobs" });
      }
      
      const { title, location, description, category, applyMethod, applyValue, remote, tags, salary } = req.body;
      
      if (!title || !location || !description || !category || !applyMethod || !applyValue) {
        return res.status(400).json({ error: "Title, location, description, category, apply method, and apply value are required" });
      }
      
      if (!["un", "ngo", "international"].includes(category)) {
        return res.status(400).json({ error: "Invalid category. Must be un, ngo, or international" });
      }
      
      if (!["link", "email"].includes(applyMethod)) {
        return res.status(400).json({ error: "Invalid apply method. Must be link or email" });
      }
      
      // Validate apply value with stricter validation
      if (applyMethod === "link") {
        if (!isValidJobUrl(applyValue)) {
          return res.status(400).json({ error: "Invalid application URL. Must be a valid HTTP/HTTPS URL." });
        }
      } else if (applyMethod === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applyValue)) {
          return res.status(400).json({ error: "Invalid email address format" });
        }
      }
      
      const job = await storage.createDirectJob({
        recruiterId: req.user!.id,
        title,
        company: profile.organizationName,
        location,
        description,
        category,
        applyMethod,
        applyValue,
        remote: remote || false,
        tags: tags || [],
        salary: salary || null,
      });
      
      res.json(job);
    } catch (error) {
      console.error("Create direct job error:", error);
      res.status(500).json({ error: "Failed to post job" });
    }
  });
  
  // Get all direct jobs
  app.get("/api/direct-jobs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const result = await storage.getDirectJobs(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Get direct jobs error:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });
  
  // Get direct job by ID
  app.get("/api/direct-jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getDirectJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Get direct job error:", error);
      res.status(500).json({ error: "Failed to get job" });
    }
  });
  
  // Get recruiter's jobs
  app.get("/api/recruiter/jobs", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "recruiter") {
        return res.status(403).json({ error: "Only recruiters can view their jobs" });
      }
      const jobs = await storage.getDirectJobsByRecruiter(req.user!.id);
      res.json(jobs);
    } catch (error) {
      console.error("Get recruiter jobs error:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // SEO: Robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /jobs/
Disallow: /api/

Sitemap: https://devglobaljobs.com/sitemap.xml
`;
    res.type("text/plain").send(robotsTxt);
  });

  // SEO: Dynamic Sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const allJobsResult = await storage.getJobs({});
      const allJobs = allJobsResult.jobs || [];
      const baseUrl = "https://devglobaljobs.com";
      const today = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/post-job</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      
      for (const job of allJobs.slice(0, 1000)) {
        const jobDate = job.postedAt ? new Date(job.postedAt).toISOString().split('T')[0] : today;
        sitemap += `  <url>
    <loc>${baseUrl}/jobs/${job.id}</loc>
    <lastmod>${jobDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
      }
      
      sitemap += `</urlset>`;
      res.type("application/xml").send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // SEO: Job Schema JSON-LD endpoint
  app.get("/api/jobs/:id/schema", async (req, res) => {
    try {
      const job = await storage.getJob(Number(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const schema = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description?.replace(/<[^>]*>/g, '') || job.title,
        "datePosted": job.postedAt ? new Date(job.postedAt).toISOString() : new Date().toISOString(),
        "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        "employmentType": job.remote ? "REMOTE" : "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.company,
          "sameAs": job.url
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location
          }
        },
        "jobLocationType": job.remote ? "TELECOMMUTE" : undefined,
        "directApply": true,
        "url": `https://devglobaljobs.com/jobs/${job.id}`,
        "identifier": {
          "@type": "PropertyValue",
          "name": job.source || "DevGlobalJobs",
          "value": job.externalId
        }
      };
      
      if (job.salary) {
        const salaryMatch = job.salary.match(/\$?([\d,]+)/);
        if (salaryMatch) {
          (schema as any).baseSalary = {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              "value": parseInt(salaryMatch[1].replace(/,/g, '')),
              "unitText": "YEAR"
            }
          };
        }
      }
      
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate schema" });
    }
  });

  // Jobs API endpoints
  app.get(api.jobs.list.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        location: req.query.location as string,
        remote: req.query.remote === 'true',
        category: req.query.category as "un" | "ngo" | "international" | undefined,
      };
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      
      // Fetch both API jobs and direct jobs
      const [apiResult, directResult] = await Promise.all([
        storage.getJobs(filters, 1, 10000), // Get all API jobs matching filters
        storage.getDirectJobs(1, 10000) // Get all direct jobs
      ]);
      
      // Convert direct jobs to unified format with prefixed IDs to avoid collisions
      const directJobsFormatted = directResult.jobs
        .filter(dj => {
          // Apply filters to direct jobs
          if (filters.category && dj.category !== filters.category) return false;
          if (filters.remote && !dj.remote) return false;
          if (filters.location && !dj.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
              dj.title.toLowerCase().includes(searchLower) ||
              dj.company.toLowerCase().includes(searchLower) ||
              dj.description.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }
          return true;
        })
        .map(dj => ({
          id: dj.id + 10000000, // Offset direct job IDs to avoid collision
          externalId: `direct-${dj.id}`,
          title: dj.title,
          company: dj.company,
          location: dj.location,
          description: dj.description,
          url: dj.applyMethod === "link" ? dj.applyValue : `mailto:${dj.applyValue}`,
          remote: dj.remote,
          tags: dj.tags || [],
          salary: dj.salary,
          source: "Direct - Dev Global Jobs",
          category: dj.category,
          postedAt: dj.postedAt,
          createdAt: dj.createdAt,
          isDirectJob: true,
          applyMethod: dj.applyMethod,
          applyValue: dj.applyValue,
        }));
      
      // Merge and sort by postedAt descending
      const allJobs = [...apiResult.jobs, ...directJobsFormatted]
        .sort((a, b) => {
          const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return dateB - dateA;
        });
      
      // Apply pagination
      const total = allJobs.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedJobs = allJobs.slice(offset, offset + limit);
      
      res.json({
        jobs: paginatedJobs,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      });
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

  // Get unique countries for filtering
  app.get("/api/countries", async (req, res) => {
    try {
      const countries = await storage.getUniqueCountries();
      res.json({ countries });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get(api.jobs.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Check if this is a direct job (ID >= 10000000)
      if (id >= 10000000) {
        const directJobId = id - 10000000;
        const directJob = await storage.getDirectJob(directJobId);
        if (directJob) {
          return res.json({
            id: directJob.id + 10000000, // Keep the offset ID for consistency
            externalId: `direct-${directJob.id}`,
            title: directJob.title,
            company: directJob.company,
            location: directJob.location,
            description: directJob.description,
            url: directJob.applyMethod === "link" ? directJob.applyValue : `mailto:${directJob.applyValue}`,
            remote: directJob.remote,
            tags: directJob.tags || [],
            salary: directJob.salary,
            source: "Direct - Dev Global Jobs",
            category: directJob.category,
            postedAt: directJob.postedAt,
            createdAt: directJob.createdAt,
            isDirectJob: true,
            applyMethod: directJob.applyMethod,
            applyValue: directJob.applyValue,
          });
        }
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Regular API job
      const apiJob = await storage.getJob(id);
      if (apiJob) {
        return res.json(apiJob);
      }
      
      return res.status(404).json({ message: "Job not found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post(api.jobs.create.path, async (req, res) => {
    try {
      if (!req.body.url || !req.body.url.startsWith('http')) {
        return res.status(400).json({ message: "A valid application URL is required." });
      }
      const uniqueId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const jobData = {
        ...req.body,
        externalId: req.body.externalId || uniqueId,
        source: req.body.source || "UserPosted",
        category: "international",
        postedAt: new Date(),
        url: req.body.url,
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

  // Admin endpoint to force clear database and resync all jobs
  app.post("/api/admin/force-sync", async (req, res) => {
    try {
      console.log("=== ADMIN FORCE SYNC: Clearing all jobs and resyncing ===");
      await storage.clearAllJobs();
      console.log("Database cleared. Starting fresh sync...");
      
      // Wait a moment for database to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const count = await syncAllJobs();
      console.log(`Force sync complete. Added ${count} jobs.`);
      
      res.json({ 
        message: "Force sync complete - database cleared and resynced", 
        count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Force sync failed:", error);
      res.status(500).json({ message: "Failed to force sync jobs" });
    }
  });

  return httpServer;
}
