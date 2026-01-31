import { useRoute, Link } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Globe, 
  Clock, 
  ExternalLink,
  Share2,
  Bookmark
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: job, isLoading, error } = useJob(id);

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
                  Read the full description and apply on the company's official site.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      Apply Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" className="w-full">
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
    </div>
  );
}
