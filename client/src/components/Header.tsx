import { Link } from "wouter";
import { Briefcase, Plus, RefreshCw, Globe, User, LogOut, LogIn, FileUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncJobs } from "@/hooks/use-jobs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { mutate: syncJobs, isPending } = useSyncJobs();
  const { toast } = useToast();
  const [isRotating, setIsRotating] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const handleSync = () => {
    setIsRotating(true);
    syncJobs(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Jobs Updated",
          description: `${data.count} new jobs added from worldwide sources.`,
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

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight leading-tight">
              Dev Global<span className="text-primary">Jobs</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium leading-tight hidden sm:block">
              Trend Nova World Ltd.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4 text-primary" />
            <span>193 Countries</span>
          </div>
          
          <div className="h-6 w-px bg-border/60 hidden md:block" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isPending}
            className="hidden sm:flex"
            data-testid="button-refresh-feed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRotating ? "animate-spin" : ""}`} />
            {isPending ? "Syncing..." : "Refresh Feed"}
          </Button>

          <Link href="/post-job">
            <Button size="sm" className="shadow-lg shadow-primary/20" data-testid="button-post-job">
              Post a Job
              <Plus className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-user-menu">
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.firstName || user.email.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      {user.role === "recruiter" ? "Recruiter" : "Job Seeker"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    {user.role === "jobseeker" && (
                      <Link href="/profile-development">
                        <DropdownMenuItem className="cursor-pointer" data-testid="menu-build-cv">
                          <FileUser className="w-4 h-4 mr-2" />
                          Build CV
                        </DropdownMenuItem>
                      </Link>
                    )}
                    {user.role === "recruiter" && (
                      <Link href="/post-job">
                        <DropdownMenuItem className="cursor-pointer" data-testid="menu-post-job">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Post a Job
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600" data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" size="sm" data-testid="button-login">
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
