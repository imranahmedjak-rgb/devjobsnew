import { useState } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { Header } from "@/components/Header";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  
  // Debounce could be added here for production, 
  // currently we'll pass state directly to the hook
  const { data: jobs, isLoading, error } = useJobs({
    search: search || undefined,
    location: location || undefined,
    remote: remote || undefined,
  });

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground"
          >
            Find your next <span className="text-primary relative inline-block">
              global
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span> career
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Curated opportunities from top companies worldwide. 
            Updated automatically every hour.
          </motion.p>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 border border-border/50 max-w-3xl mx-auto flex flex-col md:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Job title, keywords, or company..." 
                className="pl-10 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-px bg-border my-2 hidden md:block" />
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="City, country, or timezone..." 
                className="pl-10 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30">
              Search Jobs
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 pt-4"
          >
            <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-full border border-border/50">
              <Switch 
                id="remote-mode" 
                checked={remote}
                onCheckedChange={setRemote}
              />
              <Label htmlFor="remote-mode" className="cursor-pointer font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Remote Only
              </Label>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Jobs Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Latest Openings</h2>
          <span className="text-sm text-muted-foreground">
            {jobs ? `${jobs.length} jobs found` : 'Loading...'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
            <h3 className="text-lg font-semibold text-destructive">Failed to load jobs</h3>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border/50">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
