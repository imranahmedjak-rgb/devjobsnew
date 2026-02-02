# Dev Global Jobs - International Job Board Platform

## Overview

Dev Global Jobs is an international job aggregation platform by Trend Nova World Ltd. that aggregates professional job listings from worldwide sources. The platform features three job categories:

1. **UN Jobs**: United Nations agencies, World Bank, IMF, and international development banks
2. **NGO Jobs**: Non-governmental organizations, humanitarian agencies, and civil society
3. **International Jobs**: Professional opportunities from 200+ sources across all industries worldwide

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
- `category` field: "un", "ngo", or "international"

### Key Design Patterns
1. **Shared Schema**: Database schema and API routes defined in `shared/` directory for full-stack type safety
2. **Storage Abstraction**: `DatabaseStorage` class implements `IStorage` interface for clean data access
3. **Multi-Source Aggregation**: Background sync fetches jobs from 200+ sources (APIs + global companies)
4. **Query-based Filtering**: Search, location, remote, and category filters handled via SQL queries with Drizzle ORM
5. **Three-Category System**: Jobs categorized as "un", "ngo", or "international"

## Job Categories

### UN Jobs
- **Organizations**: UNICEF, UNDP, UNHCR, WFP, WHO, FAO, UNESCO, ILO, UNEP, UN Women, UNFPA, OCHA, World Bank, IMF, ADB, AfDB, EBRD, and more
- **Sources**: ReliefWeb API, generated positions from 30+ UN agencies
- **Coverage**: Global duty stations including HQ locations (New York, Geneva, Vienna, Rome, etc.) and field offices

### NGO Jobs
- **Organizations**: ICRC, IFRC, MSF, Oxfam, Save the Children, World Vision, CARE, Mercy Corps, IRC, NRC, DRC, USAID, GIZ, and more
- **Sources**: ReliefWeb API, generated positions from 30+ humanitarian organizations
- **Coverage**: Humanitarian response locations, development program countries, and remote positions

### International Jobs
- **Coverage**: Professional opportunities from 200+ sources worldwide
- **Regions**: USA, Canada, Europe, UK, Middle East, Asia Pacific, Australia, Latin America, Africa, Remote
- **Industries**: Technology, Finance, Consulting, Healthcare, Engineering, Marketing, Sales, Operations, Legal, HR, and more
- **Companies**: Google, Microsoft, Amazon, Apple, Meta, Goldman Sachs, McKinsey, Deloitte, BMW, HSBC, Samsung, Emirates, Shopify, Atlassian, and 100+ more

## Job Sources (200+)

### External APIs (Active)
- **ReliefWeb API v2**: UN and humanitarian sector jobs
  - Appname: `TrendNova-v5ofdaDo` (approved by ReliefWeb team)
  - API: https://api.reliefweb.int/v2/jobs
  - RSS Fallback: https://reliefweb.int/jobs/rss.xml
  - Note: Uses curl via child_process because Node.js fetch gets 202 empty response
- **UN Careers**: Official UN job feed (https://careers.un.org/jobfeed)
- **Arbeitnow API**: European and remote jobs (https://www.arbeitnow.com/api/job-board-api)
- **RemoteOK API**: Remote jobs worldwide (https://remoteok.com/api)
- **Jobicy API**: Remote job listings (https://jobicy.com/api/v2/remote-jobs)
- **Himalayas API**: Remote job opportunities (https://himalayas.app/jobs/api)

### Generated Job Sources
- **UN Agencies**: 30+ agencies with 150+ positions per sync
- **NGO Organizations**: 30+ organizations with 150+ positions per sync
- **International Companies**: 100+ global companies with region-specific positions
- **Regional Coverage**:
  - US: 100 positions
  - Canada: 80 positions
  - EU: 150 positions
  - Middle East: 100 positions
  - Asia Pacific: 100 positions
  - Diverse international: 500+ positions

### Total Coverage
- 100+ countries represented
- 1500+ jobs per sync across all categories
- Real-time updates every 2 minutes
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

### Three Category Tabs
- UN Jobs: Development sector positions
- NGO Jobs: Humanitarian and non-profit positions
- International Jobs: Global professional opportunities

### Post a Job
- Full form validation for job submissions
- Auto-generated external ID and timestamps
- Server-side validation with Zod schemas
- Success confirmation flow

### Job Statistics
- Total jobs count (1500+)
- Countries covered (100+)
- Number of sources (200+)
- Real-time updates

### Dynamic Country Filter
- **Searchable Dropdown**: Users can search and select from all countries with available jobs
- **Dynamic Population**: Countries are automatically extracted from job data (no hard-coded list)
- **Country Badges**: Top 12 countries shown as clickable badges for quick filtering
- **Normalization**: Handles country name variations (USA/US/United States, UK/United Kingdom, etc.)
- **API Endpoint**: `GET /api/countries` returns dynamically generated country list
- **Mobile Friendly**: Popover-based dropdown works on all screen sizes

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
- Sources: ReliefWeb, Arbeitnow, RemoteOK, Jobicy, Himalayas, UN Careers, and company career pages
- Verified URLs from trusted sources

### Paid Job Posting (Recruiters)
- **Price**: $2.00 USD per job posting
- **Payment**: Stripe integration with secure checkout
- **Flow**: Recruiter fills form → pays $2 via Stripe → job published
- **Security**: 
  - Job data stored server-side in `pending_jobs` table before payment
  - Payment verified via Stripe session (amount, user ID, payment status)
  - No client-side data used for job creation (prevents tampering)
- **Database Tables**:
  - `pending_jobs`: Temporary storage during payment flow
  - `direct_jobs`: Published recruiter job listings
- **API Endpoints**:
  - `POST /api/stripe/create-job-payment-session`: Create Stripe checkout session
  - `POST /api/stripe/verify-payment`: Verify payment and publish job

### AI Chat Assistant
- **Location**: Floating button in bottom-right corner of all pages
- **Purpose**: Helps users with job searching, career advice, and platform navigation
- **Technology**: OpenAI GPT models via Replit AI Integrations (no API key required)
- **Features**:
  - Real-time streaming responses using Server-Sent Events (SSE)
  - Conversation history persisted in PostgreSQL database
  - New chat functionality to start fresh conversations
- **Database Tables**:
  - `conversations`: Stores chat sessions with title and timestamps
  - `messages`: Individual messages with role (user/assistant), content, and timestamps
- **API Endpoints**:
  - `POST /api/conversations`: Create new conversation
  - `GET /api/conversations/:id`: Get conversation with messages
  - `POST /api/conversations/:id/messages`: Send message and receive streaming response
- **Component**: `client/src/components/AIChatWidget.tsx`
- **Routes**: `server/replit_integrations/chat/routes.ts`
