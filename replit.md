# Dev Global Jobs - International Job Board Platform

## Overview

Dev Global Jobs is an international job aggregation platform by Trend Nova World Ltd. that aggregates professional job listings from worldwide sources. The platform focuses exclusively on **International Jobs** from top global companies across all professional sectors, covering US, Canada, Europe, Middle East, Asia Pacific, and remote opportunities worldwide.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth list and interaction animations
- **Build Tool**: Vite with custom development plugins for Replit integration
- **Auto-Refresh**: Client refreshes job listings every 15 seconds

The frontend follows a pages-based structure with reusable components. API contracts are defined in `shared/routes.ts` using Zod schemas, ensuring type safety between client and server.

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` for consistency
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Job Sync**: Background job sync runs every 2 minutes for near real-time updates
- **Build Process**: esbuild for production bundling with selective dependency bundling to optimize cold start times

The server implements a storage pattern (`IStorage` interface) for database operations, making it easy to swap implementations if needed.

### Data Model
Single table design for jobs:
- `jobs`: Stores aggregated job listings with fields for title, company, location, description (HTML), remote flag, tags array, salary, source API identifier, and timestamps
- Uses `externalId` for deduplication when syncing from external APIs
- `category` field defaults to "international"

### Key Design Patterns
1. **Shared Schema**: Database schema and API routes defined in `shared/` directory for full-stack type safety
2. **Storage Abstraction**: `DatabaseStorage` class implements `IStorage` interface for clean data access
3. **Multi-Source Aggregation**: Background sync fetches jobs from 4+ external APIs plus curated global company jobs
4. **Query-based Filtering**: Search, location, and remote filters handled via SQL queries with Drizzle ORM
5. **Single Category Focus**: All jobs are International professional roles

## International Jobs Focus

### Geographic Coverage
- **North America**: USA (100+ cities), Canada (Toronto, Vancouver, Montreal, etc.)
- **Europe**: UK, Germany, France, Netherlands, Switzerland, Sweden, Ireland, Spain, Italy, and more
- **Middle East**: UAE (Dubai, Abu Dhabi), Saudi Arabia, Qatar, Israel, Jordan, Egypt
- **Asia Pacific**: Australia, Singapore, Japan, South Korea, Hong Kong, India, and more
- **Latin America**: Brazil, Mexico, Argentina, Chile, Colombia
- **Africa**: South Africa, Nigeria, Kenya, Ghana, Morocco
- **Remote**: Worldwide remote positions

### Industries Covered
- Technology (Software, AI, Cloud, DevOps)
- Finance & Banking
- Consulting (Management, Strategy)
- Healthcare & Pharmaceuticals
- Engineering & Manufacturing
- Marketing & Sales
- Operations & Supply Chain
- Legal & Compliance
- Human Resources
- And more...

### Featured Companies (100+)
Global leaders including: Google, Microsoft, Amazon, Apple, Meta, Goldman Sachs, McKinsey, Deloitte, BMW, HSBC, Nestlé, Spotify, Samsung, Emirates, Shopify, Atlassian, and many more.

## Job Sources

### External APIs (Active)
- **Arbeitnow API**: European and remote jobs (https://www.arbeitnow.com/api/job-board-api)
- **RemoteOK API**: Remote jobs worldwide (https://remoteok.com/api)
- **Jobicy API**: Remote job listings (https://jobicy.com/api/v2/remote-jobs)
- **Himalayas API**: Remote job opportunities (https://himalayas.app/jobs/api)

### Generated Job Sources
- Jobs from 100+ major global companies across all regions
- Region-specific generation: US (100), Canada (80), EU (150), Middle East (100), Asia Pacific (100)
- 500+ diverse international positions from global companies

### Coverage
- 100+ countries represented
- Professional roles across all sectors
- Remote and on-site positions
- Direct application links

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations` directory

### Key NPM Packages
- `@tanstack/react-query`: Client-side data fetching and caching
- `drizzle-orm` / `drizzle-zod`: Type-safe database operations
- `date-fns`: Date formatting (relative time display)
- `framer-motion`: UI animations
- `wouter`: Lightweight routing
- `zod`: Runtime type validation for API contracts

### Development Tools
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Replit-specific tooling
- `tsx`: TypeScript execution for development server

## Key Features

### Post a Job
- Full form validation for job submissions
- Auto-generated external ID and timestamps
- Server-side validation with Zod schemas
- Success confirmation flow

### Job Statistics
- Total jobs count (1000+)
- Countries covered (100+)
- Number of sources
- Real-time updates

### Auto-Refresh System
- Server syncs new jobs every 2 minutes
- Client refreshes listings every 15 seconds
- Window focus triggers immediate refresh

### SEO Optimization
- **Sitemap**: Dynamic sitemap.xml at `/sitemap.xml` with all job pages
- **Robots.txt**: Available at `/robots.txt` for search engine crawling
- **Job Schema Markup**: JSON-LD structured data on job detail pages (Google Jobs compatible)
- **Meta Tags**: Full Open Graph and Twitter Card meta tags
- **SEO-Friendly URLs**: Clean `/jobs/:id` URL structure for job pages

### Legal Pages
- About Us (`/about`)
- Contact Us (`/contact`)
- Terms and Conditions (`/terms`)
- Privacy Policy (`/privacy`)
- Cookie Policy (`/cookies`)
- Disclaimer (`/disclaimer`)

### Job Application Links
- All jobs have direct application links
- Sources: Arbeitnow, RemoteOK, Jobicy, Himalayas, and company career pages
- Verified URLs from trusted sources
