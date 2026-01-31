import { Link } from "wouter";
import { Briefcase, Plus, RefreshCw, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncJobs } from "@/hooks/use-jobs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function Header() {
  const { mutate: syncJobs, isPending } = useSyncJobs();
  const { toast } = useToast();
  const [isRotating, setIsRotating] = useState(false);

  const handleSync = () => {
    setIsRotating(true);
    syncJobs(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Jobs Synced",
          description: `${data.count} jobs updated successfully.`,
        });
        setTimeout(() => setIsRotating(false), 1000);
      },
      onError: () => {
        toast({
          title: "Sync Failed",
          description: "Could not update jobs at this time.",
          variant: "destructive",
        });
        setIsRotating(false);
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Global<span className="text-primary">Jobs</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors items-center gap-2"
          >
            <Github className="w-4 h-4" />
            <span>Open Source</span>
          </a>
          
          <div className="h-6 w-px bg-border/60 hidden sm:block" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isPending}
            className="hidden sm:flex"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRotating ? "animate-spin" : ""}`} />
            {isPending ? "Syncing..." : "Refresh Feed"}
          </Button>

          <Button size="sm" className="shadow-lg shadow-primary/20">
            Post a Job
            <Plus className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
