import { Link } from "wouter";
import { Job } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, MapPin, Building2, Globe, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const postedDate = new Date(job.postedAt);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/jobs/${job.id}`} className="block h-full no-underline">
        <Card className="h-full p-6 bg-white dark:bg-slate-950 border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group relative overflow-hidden">
          
          {/* Subtle gradient background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {job.title}
                </h3>
              </div>
              {job.remote && (
                <Badge variant="secondary" className="ml-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800">
                  <Globe className="w-3 h-3 mr-1" />
                  Remote
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                {job.source}
              </div>
              <div className="text-xs text-muted-foreground ml-auto flex items-center py-1">
                {timeAgo}
              </div>
            </div>

            {/* Tags section */}
            <div className="mt-auto">
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-16 overflow-hidden">
                {job.tags?.slice(0, 3).map((tag, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
                {(job.tags?.length || 0) > 3 && (
                  <span className="text-xs text-muted-foreground flex items-center px-1">
                    +{job.tags!.length - 3} more
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center text-sm font-semibold text-primary group-hover:underline decoration-2 underline-offset-4">
                View Details <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
