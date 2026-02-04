import { useState, useMemo } from "react";
import { useJobs } from "@/hooks/use-jobs";
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
import { Search, MapPin, Globe, Building2, Heart, Landmark, Users, CheckCircle, Loader2, ChevronDown, X, Shield, Clock, Award, ArrowRight, Wifi, Plane } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobCategory } from "@shared/schema";

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [category, setCategory] = useState<JobCategory>("un");
  const [countryOpen, setCountryOpen] = useState(false);
  
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

  const getCategoryTitle = () => {
    switch (category) {
      case "un": return "UN Agency Opportunities";
      case "ngo": return "NGO & Humanitarian Careers";
      case "remote": return "Remote Work Opportunities";
      case "international": return "International Careers";
      default: return "Global Job Opportunities";
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case "un": return "Positions at United Nations agencies, World Bank, IMF, and international development organizations";
      case "ngo": return "Careers with humanitarian organizations, relief agencies, and civil society organizations";
      case "remote": return "Work from anywhere - verified remote positions from top global companies";
      case "international": return "Global career opportunities from international employers worldwide";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
      <Header />
      
      {/* Hero Section - ReliefWeb Inspired Clean Design */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Verified Development Sector Positions</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
            >
              International Development
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Career Opportunities
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Access verified positions from UN agencies, World Bank, IMF, and leading humanitarian NGOs. 
              Updated continuously from ReliefWeb and official UN career portals.
            </motion.p>

            {/* Quick Feature Highlights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Updated Every 2 Minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Award className="w-4 h-4 text-green-400" />
                <span>Trusted Sources Only</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-background"/>
          </svg>
        </div>
      </section>

      {/* Category Selection */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <Tabs value={category} onValueChange={(v) => setCategory(v as JobCategory)} className="w-full">
            <TabsList className="w-full h-auto p-2 bg-card shadow-xl border border-border/50 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger 
                value="un" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                data-testid="tab-un"
              >
                <Landmark className="w-4 h-4" />
                <div className="text-left">
                  <span className="font-semibold block text-sm">UN Jobs</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="ngo" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                data-testid="tab-ngo"
              >
                <Heart className="w-4 h-4" />
                <div className="text-left">
                  <span className="font-semibold block text-sm">NGO Jobs</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="remote" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                data-testid="tab-remote"
              >
                <Wifi className="w-4 h-4" />
                <div className="text-left">
                  <span className="font-semibold block text-sm">Remote</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="international" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                data-testid="tab-international"
              >
                <Plane className="w-4 h-4" />
                <div className="text-left">
                  <span className="font-semibold block text-sm">International</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          {/* Search Bar */}
          <div className="p-2 bg-card rounded-2xl shadow-lg border border-border/50 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search by job title, organization, or keywords..." 
                className="pl-12 h-14 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
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
                    className="w-full h-14 justify-start text-left font-normal hover:bg-transparent px-4"
                    data-testid="button-country-filter"
                  >
                    <MapPin className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
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
                      <span className="text-muted-foreground flex-1">Filter by country...</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start" sideOffset={8}>
                  <Command className="rounded-lg border shadow-lg">
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Select Duty Station</span>
                    </div>
                    <CommandInput 
                      placeholder="Search countries..." 
                      className="h-11 text-base"
                      data-testid="input-country-search" 
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-sm">No country found.</CommandEmpty>
                      <CommandGroup heading="Available Locations">
                        {countriesData?.countries.map((country) => (
                          <CommandItem
                            key={country}
                            value={country}
                            onSelect={(value) => {
                              setLocation(value === location ? "" : value);
                              setCountryOpen(false);
                            }}
                            className="py-2.5 cursor-pointer"
                            data-testid={`option-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="flex-1">{country}</span>
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
            <Button size="lg" className="h-14 px-8 rounded-xl font-semibold" data-testid="button-search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 bg-card px-4 py-2.5 rounded-full border border-border/50">
                <Switch 
                  id="remote-mode" 
                  checked={remote}
                  onCheckedChange={setRemote}
                  data-testid="switch-remote-only"
                />
                <Label htmlFor="remote-mode" className="cursor-pointer font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Remote Positions
                </Label>
              </div>
            </div>

            {/* Popular Countries */}
            {countriesData?.countries && countriesData.countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {countriesData.countries.slice(0, 5).map((country) => (
                  <Badge 
                    key={country}
                    variant={location === country ? "default" : "outline"} 
                    className="px-3 py-1.5 cursor-pointer hover-elevate" 
                    data-testid={`badge-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setLocation(location === country ? "" : country)}
                  >
                    {country}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Jobs Section */}
      <section className="container mx-auto px-4 pb-16 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/50">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {category === "un" ? (
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {getCategoryTitle()}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getCategoryDescription()}
              </p>
            </div>
            {isLoading && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading positions...
              </span>
            )}
          </div>

          {/* Jobs Grid */}
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
                <h3 className="text-lg font-semibold text-destructive">Unable to load positions</h3>
                <p className="text-muted-foreground mt-2">Please refresh the page and try again.</p>
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
                <h3 className="text-lg font-semibold">No positions found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search criteria or selecting a different category.</p>
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
                        <>
                          Load More Positions
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold mb-2">Trusted by Development Professionals Worldwide</h3>
              <p className="text-sm text-muted-foreground">
                Aggregating verified opportunities from official sources
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-sm">Verified Sources</h4>
                <p className="text-xs text-muted-foreground mt-1">ReliefWeb & UN Careers</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-sm">Real-time Updates</h4>
                <p className="text-xs text-muted-foreground mt-1">Synced every 2 minutes</p>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-sm">Global Coverage</h4>
                <p className="text-xs text-muted-foreground mt-1">Positions worldwide</p>
              </div>
            </div>

            {/* Source Logos/Names */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-center text-xs text-muted-foreground mb-4">Data sourced from</p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <Building2 className="w-4 h-4" />
                  <span>ReliefWeb</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <Landmark className="w-4 h-4" />
                  <span>UN Careers</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <Globe className="w-4 h-4" />
                  <span>UNDP Jobs</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <Users className="w-4 h-4" />
                  <span>UN Agency Portals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
