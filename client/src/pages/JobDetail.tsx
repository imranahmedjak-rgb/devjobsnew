import { useRoute, Link } from "wouter";
import { useEffect, useState } from "react";
import { useJob } from "@/hooks/use-jobs";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth, apiRequest } from "@/lib/auth";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Clock, 
  ExternalLink,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
  Send,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

function JobSchemaScript({ job }: { job: any }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'job-schema';
    
    const schema = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description?.replace(/<[^>]*>/g, '') || job.title,
      "datePosted": new Date(job.postedAt).toISOString(),
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
    
    script.textContent = JSON.stringify(schema);
    
    // Remove any existing schema
    const existing = document.getElementById('job-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    // Update page title and meta for SEO
    document.title = `${job.title} at ${job.company} | Dev Global Jobs`;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Apply for ${job.title} position at ${job.company} in ${job.location}. ${job.remote ? 'Remote work available.' : ''} View job details and apply now on Dev Global Jobs.`);
    
    // Update Open Graph tags
    const ogTags = [
      { property: 'og:title', content: `${job.title} at ${job.company}` },
      { property: 'og:description', content: `Apply for ${job.title} at ${job.company} in ${job.location}` },
      { property: 'og:url', content: `https://devglobaljobs.com/jobs/${job.id}` },
      { property: 'og:type', content: 'website' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });
    
    return () => {
      const toRemove = document.getElementById('job-schema');
      if (toRemove) toRemove.remove();
    };
  }, [job]);
  
  return null;
}

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: job, isLoading, error } = useJob(id);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAuthenticated = user !== null;
  
  // Easy Apply state
  const [isApplying, setIsApplying] = useState(false);
  
  // Check if job is saved in localStorage
  const [isSaved, setIsSaved] = useState(() => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    return savedJobs.includes(id);
  });
  
  // Easy Apply - send application directly
  const handleEasyApply = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please sign in to use Easy Apply.",
        variant: "destructive"
      });
      return;
    }
    if (!isJobSeeker) {
      toast({
        title: "Job Seeker Account Required",
        description: "Easy Apply is only available for job seekers.",
        variant: "destructive"
      });
      return;
    }
    
    setIsApplying(true);
    try {
      const directJobId = id >= 10000000 ? id - 10000000 : undefined;
      const response = await apiRequest("/api/candidate/apply", {
        method: "POST",
        body: JSON.stringify({ directJobId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to apply");
      }
      
      toast({
        title: "Application Sent!",
        description: "Your profile and CV have been sent to the recruiter. They will contact you via email.",
      });
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };
  
  // Check if Easy Apply is available (direct job with email apply method)
  // Job type is extended with isDirectJob and applyMethod for direct jobs
  const jobWithMeta = job as typeof job & { isDirectJob?: boolean; applyMethod?: string };
  const isEasyApplyAvailable = jobWithMeta?.isDirectJob && jobWithMeta?.applyMethod === "email";
  const isJobSeeker = user?.role === "jobseeker";

  // Handle Save/Bookmark
  const handleSave = () => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    
    if (isSaved) {
      // Remove from saved
      const updated = savedJobs.filter((jobId: number) => jobId !== id);
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      setIsSaved(false);
      toast({
        title: "Removed from saved jobs",
        description: "Job has been removed from your bookmarks.",
      });
    } else {
      // Add to saved
      savedJobs.push(id);
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      setIsSaved(true);
      toast({
        title: "Job saved!",
        description: "Job has been added to your bookmarks.",
      });
    }
  };

  // Handle Share
  const handleShare = async () => {
    const shareUrl = `https://devglobaljobs.com/jobs/${id}`;
    const shareData = {
      title: job ? `${job.title} at ${job.company}` : 'Job Opportunity',
      text: job ? `Check out this job: ${job.title} at ${job.company}` : 'Check out this job opportunity!',
      url: shareUrl,
    };

    try {
      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully!",
          description: "Job link has been shared.",
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Job link has been copied to your clipboard.",
        });
      }
    } catch (err) {
      // If share was cancelled or failed, try clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Job link has been copied to your clipboard.",
        });
      } catch {
        toast({
          title: "Share failed",
          description: "Please copy the URL from the address bar.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-64 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Job not found</h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const postedAgo = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <JobSchemaScript job={job} />
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to listings
          </Button>
        </Link>
      </div>

      <main className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border/60 shadow-sm">
              <div className="flex flex-wrap gap-3 mb-6">
                {job.remote && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800 px-3 py-1">
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    Remote
                  </Badge>
                )}
                <Badge variant="outline" className="px-3 py-1">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Posted {postedAgo}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 uppercase tracking-wider text-[10px] font-bold">
                  {job.source}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{job.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border/60 shadow-sm">
              <h2 className="text-xl font-bold mb-6 font-display">About the role</h2>
              <div 
                className="prose-custom max-w-none"
                dangerouslySetInnerHTML={{ __html: job.description }} 
              />
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-border/60 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Keywords & Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              <Card className="p-6 border-border/60 shadow-lg shadow-black/5 rounded-2xl bg-white dark:bg-slate-900">
                <h3 className="text-lg font-bold mb-2">Interested?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {isEasyApplyAvailable 
                    ? "Apply instantly with your profile or visit the company's site."
                    : "Read the full description and apply on the company's official site."
                  }
                </p>
                
                <div className="space-y-3">
                  {/* Two options based on how job accepts applications */}
                  {jobWithMeta?.isDirectJob ? (
                    // Direct job - show apply method based on recruiter preference
                    jobWithMeta.applyMethod === "email" ? (
                      // Option 1: Easy Apply via Email
                      <Button 
                        size="lg"
                        className="w-full text-base font-semibold shadow-lg shadow-green-500/25 bg-green-600"
                        onClick={handleEasyApply}
                        disabled={isApplying}
                        data-testid="button-easy-apply"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending Application...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Easy Apply (Send Profile & CV)
                          </>
                        )}
                      </Button>
                    ) : (
                      // Option 2: Apply via Link (recruiter's website)
                      <Button 
                        size="lg"
                        className="w-full text-base font-semibold shadow-lg shadow-primary/25"
                        asChild
                      >
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply Now (Recruiter's Website)
                        </a>
                      </Button>
                    )
                  ) : (
                    // External job - apply on company site
                    <Button 
                      size="lg"
                      className="w-full text-base font-semibold shadow-lg shadow-primary/25"
                      asChild
                    >
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        Apply Now
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className={`w-full ${isSaved ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={handleSave}
                      data-testid="button-save-job"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                      ) : (
                        <Bookmark className="w-4 h-4 mr-2" />
                      )}
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleShare}
                      data-testid="button-share-job"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="text-xs text-muted-foreground text-center">
                    Job ID: {job.externalId} <br/>
                    Source: {job.source}
                  </div>
                </div>
              </Card>

              {/* Safety Tip Card */}
              <div className="mt-6 p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Safe Job Search</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300/80 leading-relaxed">
                  Never provide bank details or pay for a job application. Report any suspicious listings immediately.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
