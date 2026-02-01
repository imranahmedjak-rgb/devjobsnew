import { useState, useMemo } from "react";
import { useJobs, useJobStats } from "@/hooks/use-jobs";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, MapPin, Globe, Briefcase, Building2, TrendingUp, Heart, Landmark, Users, CheckCircle, Loader2, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobCategory } from "@shared/schema";

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [category, setCategory] = useState<JobCategory>("international");
  const [countryOpen, setCountryOpen] = useState(false);
  
  // Fetch unique countries for filtering
  const { data: countriesData } = useQuery<{ countries: string[] }>({
    queryKey: ['/api/countries'],
  });
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useJobs({
    search: search || undefined,
    location: location || undefined,
    remote: remote || undefined,
    category,
  });

  const jobs = useMemo(() => {
    return data?.pages.flatMap(page => page.jobs) ?? [];
  }, [data]);

  const totalJobs = data?.pages[0]?.total ?? 0;

  const { data: stats } = useJobStats();

  const getCategoryTitle = () => {
    switch (category) {
      case "un": return "UN Agency Jobs";
      case "ngo": return "NGO & Humanitarian Jobs";
      case "international": return "International Jobs";
      default: return "Jobs";
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case "un": return "United Nations agencies, World Bank, IMF, and international development banks";
      case "ngo": return "Non-governmental organizations, humanitarian agencies, and civil society";
      case "international": return "Professional opportunities from 200+ sources across US, Canada, Europe, Middle East, Asia Pacific, Australia, and worldwide";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="container mx-auto max-w-5xl text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4"
          >
            <CheckCircle className="w-4 h-4" />
            Verified Jobs from 200+ Sources
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground"
          >
            Your Gateway to <span className="text-primary relative inline-block">
              Global Careers
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Curated opportunities from UN agencies, NGOs, development banks, 
            and top global companies. Real-time updates from trusted sources worldwide.
          </motion.p>

          {/* Stats */}
          {stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap justify-center gap-4 md:gap-8 pt-2"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-xl md:text-2xl font-bold block" data-testid="text-total-jobs">{stats.totalJobs.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Active Jobs</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-xl md:text-2xl font-bold block" data-testid="text-countries">{stats.countriesCount}+</span>
                  <span className="text-xs text-muted-foreground">Countries</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-xl md:text-2xl font-bold block" data-testid="text-sources">{stats.sourcesCount}+</span>
                  <span className="text-xs text-muted-foreground">Sources</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto px-4 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={category} onValueChange={(v) => setCategory(v as JobCategory)} className="w-full">
            <TabsList className="w-full max-w-3xl mx-auto h-auto p-1.5 bg-muted/50 border border-border/50 rounded-xl grid grid-cols-3 gap-1">
              <TabsTrigger 
                value="un" 
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-sm"
                data-testid="tab-un"
              >
                <Landmark className="w-4 h-4" />
                <span className="font-semibold hidden sm:inline">UN Jobs</span>
                <span className="font-semibold sm:hidden">UN</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ngo" 
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-sm"
                data-testid="tab-ngo"
              >
                <Heart className="w-4 h-4" />
                <span className="font-semibold hidden sm:inline">NGO Jobs</span>
                <span className="font-semibold sm:hidden">NGO</span>
              </TabsTrigger>
              <TabsTrigger 
                value="international" 
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all text-sm"
                data-testid="tab-international"
              >
                <Globe className="w-4 h-4" />
                <span className="font-semibold hidden sm:inline">International</span>
                <span className="font-semibold sm:hidden">Intl</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Category Description */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="max-w-2xl mx-auto mt-4 text-center"
        >
          <AnimatePresence mode="wait">
            <motion.p 
              key={category}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm text-muted-foreground"
            >
              {getCategoryDescription()}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Country Tags - Dynamic from job data */}
        {countriesData?.countries && countriesData.countries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mt-4"
          >
            {countriesData.countries.slice(0, 12).map((country) => (
              <Badge 
                key={country}
                variant={location === country ? "default" : "secondary"} 
                className="px-3 py-1.5 text-xs cursor-pointer hover-elevate" 
                data-testid={`badge-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setLocation(location === country ? "" : country)}
              >
                <Globe className="w-3 h-3 mr-1" /> {country}
              </Badge>
            ))}
            {countriesData.countries.length > 12 && (
              <Badge 
                variant="outline" 
                className="px-3 py-1.5 text-xs cursor-pointer"
                data-testid="badge-more-countries"
                onClick={() => setCountryOpen(true)}
              >
                +{countriesData.countries.length - 12} more
              </Badge>
            )}
          </motion.div>
        )}
      </section>

      {/* Search Bar */}
      <section className="container mx-auto px-4 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-2 bg-card rounded-2xl shadow-xl shadow-black/5 border border-border/50 max-w-4xl mx-auto flex flex-col md:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Job title, keywords, or company..." 
              className="pl-10 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="w-px bg-border my-2 hidden md:block" />
          <div className="relative flex-1">
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full h-12 justify-start text-left font-normal hover:bg-transparent"
                  data-testid="button-country-filter"
                >
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground shrink-0" />
                  {location ? (
                    <span className="flex items-center gap-2 flex-1">
                      <span className="truncate">{location}</span>
                      <X 
                        className="h-4 w-4 text-muted-foreground hover:text-foreground shrink-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("");
                        }}
                      />
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex-1">Select country...</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search countries..." data-testid="input-country-search" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countriesData?.countries.map((country) => (
                        <CommandItem
                          key={country}
                          value={country}
                          onSelect={(value) => {
                            setLocation(value === location ? "" : value);
                            setCountryOpen(false);
                          }}
                          data-testid={`option-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          {country}
                          {location === country && (
                            <CheckCircle className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button size="lg" className="h-12 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30" data-testid="button-search">
            Search Jobs
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <div className="flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-full border border-border/50">
            <Switch 
              id="remote-mode" 
              checked={remote}
              onCheckedChange={setRemote}
              data-testid="switch-remote-only"
            />
            <Label htmlFor="remote-mode" className="cursor-pointer font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Remote Only
            </Label>
          </div>
        </motion.div>
      </section>

      {/* Jobs Grid */}
      <section className="container mx-auto px-4 py-12 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {getCategoryTitle()}
          </h2>
          <span className="text-sm text-muted-foreground" data-testid="text-jobs-found">
            {isLoading ? 'Loading...' : `Showing ${jobs.length} of ${totalJobs.toLocaleString()} jobs`}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse border border-border/50" />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20"
            >
              <h3 className="text-lg font-semibold text-destructive">Failed to load jobs</h3>
              <p className="text-muted-foreground">Please try refreshing the page.</p>
            </motion.div>
          ) : jobs.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-muted/30 rounded-2xl border border-border/50"
            >
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters or switch categories.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
              
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    size="lg"
                    variant="outline"
                    className="px-8"
                    data-testid="button-load-more"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More Jobs`
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Trust Indicators */}
      <section className="border-t border-border/50 bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Verified Jobs</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>100+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>200+ Job Sources</span>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
