# Dev Global Jobs - International Job Board Platform

## Overview

Dev Global Jobs is an international-level job aggregation platform by Trend Nova World Ltd. that aggregates development sector, humanitarian, and professional job listings from worldwide sources covering all 193 UN countries. The platform features jobs from United Nations agencies, INGOs, NGOs, Development Banks, and international organizations.

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
- **Job Sync**: Background job sync runs every 5 minutes to fetch new listings
- **Build Process**: esbuild for production bundling with selective dependency bundling to optimize cold start times

The server implements a storage pattern (`IStorage` interface) for database operations, making it easy to swap implementations if needed.

### Data Model
Single table design for jobs:
- `jobs`: Stores aggregated job listings with fields for title, company, location, description (HTML), remote flag, tags array, salary, source API identifier, and timestamps
- Uses `externalId` for deduplication when syncing from external APIs

### Key Design Patterns
1. **Shared Schema**: Database schema and API routes defined in `shared/` directory for full-stack type safety
2. **Storage Abstraction**: `DatabaseStorage` class implements `IStorage` interface for clean data access
3. **API Aggregation**: Background sync fetches jobs from multiple external APIs for both categories
4. **Query-based Filtering**: Search, location, remote, and category filters handled via SQL queries with Drizzle ORM
5. **Three-Category System**: Jobs are categorized as "un" (UN agencies), "ngo" (NGOs/humanitarian), or "international" (global professional roles)

## Job Categories

### UN Jobs
- United Nations agencies, World Bank, IMF, and international development banks
- Keywords: UNICEF, UNDP, UNHCR, WHO, WFP, FAO, UNESCO, IOM, World Bank, IMF, ADB, OCHA, etc.
- Sources: ReliefWeb RSS, Arbeitnow, RemoteOK

### NGO Jobs
- Non-governmental organizations, humanitarian agencies, and civil society
- Keywords: NGO, nonprofit, ICRC, IFRC, Red Cross, MSF, Oxfam, Save the Children, USAID, GIZ, etc.
- Sources: ReliefWeb RSS, Arbeitnow, RemoteOK

### International Jobs
- Professional opportunities across technology, finance, consulting, and global enterprises
- Non-UN/NGO jobs from the same sources (inverse filtering)
- Sources: Arbeitnow, RemoteOK

## Job Sources

### External APIs (Active)
- **ReliefWeb RSS Feed**: Humanitarian and development sector jobs from UN agencies, INGOs, NGOs (reliefweb.int/jobs/rss.xml)
- **Arbeitnow API**: European/global jobs - split between development sector and international
- **RemoteOK API**: Remote jobs worldwide - split between development sector and international

### Job Categorization Logic
Development sector jobs are identified using keywords. International jobs are non-dev-sector jobs from the same sources.

### Coverage
- 100+ countries represented
- Development sector, humanitarian, and professional roles
- Remote and on-site positions
- Direct application links only (no organization homepages)

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
- Total jobs count
- Countries covered
- Number of sources
- Real-time updates

### Auto-Refresh System
- Server syncs new jobs every 5 minutes
- Client refreshes listings every 15 seconds
- Window focus triggers immediate refresh

### SEO Optimization
- **Sitemap**: Dynamic sitemap.xml at `/sitemap.xml` with all job pages
- **Robots.txt**: Available at `/robots.txt` for search engine crawling
- **Job Schema Markup**: JSON-LD structured data on job detail pages (Google Jobs compatible)
- **Meta Tags**: Full Open Graph and Twitter Card meta tags
- **SEO-Friendly URLs**: Clean `/jobs/:id` URL structure for job pages

### Job Application Links
- All jobs have direct, specific application links that go to the actual job posting page
- Sources: Arbeitnow (European tech jobs), RemoteOK (remote jobs worldwide)
- No organization homepage links - only verified direct job application URLs
