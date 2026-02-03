# Dev Global Jobs - Development Sector Job Platform

## Overview
Dev Global Jobs, by Trend Nova World Ltd., is a development sector job platform that aggregates professional listings from UN agencies and NGO humanitarian organizations. It features two job categories: UN Jobs (United Nations agencies, World Bank, IMF, UNDP, UNICEF, WHO, WFP, UNHCR) and NGO Jobs (humanitarian and civil society organizations). Jobs are sourced from ReliefWeb API and official UN career portals.

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
- **Job Sync**: Background job synchronization runs every 2 minutes from ReliefWeb and UN sources.
- **Build Process**: esbuild for production bundling.
- **Data Access**: Implements a storage pattern (`IStorage` interface) for database operations.

### Data Model
- **Jobs**: Stores aggregated listings with title, company, location, description, remote flag, tags, salary, source identifier, and timestamps. Features an `externalId` for deduplication and a `category` field ("un" or "ngo").

### Key Design Patterns
- **Shared Schema**: Database schema and API routes in `shared/` for full-stack type safety.
- **Storage Abstraction**: `DatabaseStorage` class implementing `IStorage`.
- **Development Sector Focus**: Jobs from ReliefWeb and UN career portals only.
- **Query-based Filtering**: Supports search, location, remote, and category filters via SQL queries.
- **Two-Category System**: Jobs classified into "un" or "ngo".

### Key Features
- **Job Categories**: Two tabs for UN Jobs and NGO Jobs.
- **Job Posting**: Organizations can post development sector jobs with Stripe payment ($2 USD).
- **Job Statistics**: Displays total jobs, countries covered, and sources.
- **Dynamic Country Filter**: Searchable dropdown and badges for countries, dynamically populated from job data.
- **Auto-Refresh System**: Server syncs jobs every 2 minutes, client refreshes every 15 seconds.
- **SEO Optimization**: Development sector focused meta-data, structured data schemas (Organization, WebSite, CollectionPage, BreadcrumbList, FAQPage, EmploymentAgency), Open Graph, Twitter Cards.
- **Legal Pages**: About Us, Contact Us, Terms, Privacy, Cookie, Disclaimer pages.
- **Job Application Links**: Direct application links from original sources.

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
- **ReliefWeb API v2**: UN and humanitarian sector jobs (appname: TrendNova-v5ofdaDo).
- **UN Careers**: Official UN job feed (careers.un.org).
- **UNDP Jobs**: UN Development Programme careers.
- **Stripe**: For secure payment processing for paid job postings ($2 USD).

### Company Information
- **Company**: Trend Nova World Limited
- **UK Company Number**: 16709289
- **Founded**: 2025-07-22
- **Address**: 27 Old Gloucester Street, London WC1N 3AX, UK
