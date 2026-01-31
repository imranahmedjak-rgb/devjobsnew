# GlobalJobs - Job Board Application

## Overview

GlobalJobs is a job aggregation platform that fetches job listings from multiple external APIs (Arbeitnow, ReliefWeb) and presents them in a modern, searchable interface. The application allows users to browse, filter, and view detailed job postings from various sources worldwide.

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

The frontend follows a pages-based structure with reusable components. API contracts are defined in `shared/routes.ts` using Zod schemas, ensuring type safety between client and server.

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` for consistency
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build Process**: esbuild for production bundling with selective dependency bundling to optimize cold start times

The server implements a storage pattern (`IStorage` interface) for database operations, making it easy to swap implementations if needed.

### Data Model
Single table design for jobs:
- `jobs`: Stores aggregated job listings with fields for title, company, location, description (HTML), remote flag, tags array, salary, source API identifier, and timestamps
- Uses `externalId` for deduplication when syncing from external APIs

### Key Design Patterns
1. **Shared Schema**: Database schema and API routes defined in `shared/` directory for full-stack type safety
2. **Storage Abstraction**: `DatabaseStorage` class implements `IStorage` interface for clean data access
3. **API Aggregation**: Background sync fetches jobs from multiple external APIs and stores them locally
4. **Query-based Filtering**: Search, location, and remote filters handled via SQL queries with Drizzle ORM

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations` directory

### External Job APIs
- **Arbeitnow API** (`https://www.arbeitnow.com/api/job-board-api`): Tech job listings
- **ReliefWeb API**: Humanitarian job listings

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