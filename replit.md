# Dev Global Jobs - International Job Board Platform

## Overview
Dev Global Jobs, by Trend Nova World Ltd., is an international job aggregation platform that consolidates professional job listings from diverse global sources. It categorizes jobs into three main types: UN Jobs (United Nations, World Bank, IMF), NGO Jobs (non-governmental and humanitarian organizations), and International Jobs (professional opportunities from over 200 sources worldwide across various industries). The platform aims to be a comprehensive resource for job seekers targeting international and development sector roles.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui (New York style)
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Data Refresh**: Client refreshes job listings every 15 seconds.
- **Structure**: Pages-based with reusable components; API contracts defined in `shared/routes.ts` using Zod for type safety.

### Backend
- **Framework**: Express 5 on Node.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Job Sync**: Background job synchronization runs every 2 minutes.
- **Build Process**: esbuild for production bundling.
- **Data Access**: Implements a storage pattern (`IStorage` interface) for database operations.

### Data Model
- **Users**: Stores user accounts, profile details, and email verification status.
- **Jobs**: Stores aggregated listings with title, company, location, description, remote flag, tags, salary, source identifier, and timestamps. Features an `externalId` for deduplication and a `category` field ("un", "ngo", "international").

### Key Design Patterns
- **Shared Schema**: Database schema and API routes in `shared/` for full-stack type safety.
- **Storage Abstraction**: `DatabaseStorage` class implementing `IStorage`.
- **Multi-Source Aggregation**: Fetches jobs from 200+ sources.
- **Query-based Filtering**: Supports search, location, remote, and category filters via SQL queries.
- **Three-Category System**: Jobs classified into "un", "ngo", or "international".

### Key Features
- **Job Categories**: Dedicated tabs for UN, NGO, and International jobs.
- **Job Posting**: Recruiters can post jobs with full validation and Stripe integration for payment.
- **Job Statistics**: Displays total jobs, countries covered, and sources.
- **Dynamic Country Filter**: Searchable dropdown and badges for countries, dynamically populated from job data.
- **Auto-Refresh System**: Server syncs jobs every 2 minutes, client refreshes every 15 seconds.
- **SEO Optimization**: Comprehensive meta-data, sitemap, robots.txt, structured data schemas (Organization, WebSite, JobPosting Aggregate, BreadcrumbList, FAQPage, Job Schema Markup), Open Graph, Twitter Cards, SEO-friendly URLs.
- **Legal Pages**: Standard About Us, Contact Us, Terms, Privacy, Cookie, Disclaimer pages.
- **Job Application Links**: Direct application links from original sources.
- **AI Chat Assistant**: Floating widget using OpenAI GPT via Replit AI for job search and career advice, with real-time streaming and conversation history persistence.
- **AI-Powered Profile Development**: A 5-step wizard for job seekers to build professional CVs with live preview and one-click PDF download.
- **Easy Apply**: For direct-posted jobs, allows job seekers to apply using their platform profile data, supporting email or URL methods, with application history tracking.
- **Social Login**: Integration with Replit Auth for Google, Apple, X, and GitHub logins.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.
- **Drizzle Kit**: For database migrations.

### Key NPM Packages
- `@tanstack/react-query`
- `drizzle-orm` / `drizzle-zod`
- `date-fns`
- `framer-motion`
- `wouter`
- `zod`

### External APIs / Services
- **ReliefWeb API v2**: UN and humanitarian sector jobs.
- **UN Careers**: Official UN job feed.
- **Arbeitnow API**: European and remote jobs.
- **RemoteOK API**: Remote jobs worldwide.
- **Jobicy API**: Remote job listings.
- **Himalayas API**: Remote job opportunities.
- **Stripe**: For secure payment processing for paid job postings.
- **OpenAI GPT models**: Via Replit AI Integrations for the AI Chat Assistant.
- **Resend API**: For sending application emails (if configured).
- **Replit Auth**: For social login integration.