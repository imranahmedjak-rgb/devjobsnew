import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, Building2, MapPin, DollarSign, Tag, Globe, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface JobFormData {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  remote: boolean;
  tags: string;
  salary: string;
}

export default function PostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    description: "",
    url: "",
    remote: false,
    tags: "",
    salary: "",
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const response = await apiRequest("POST", "/api/jobs", {
        title: data.title,
        company: data.company,
        location: data.location,
        description: data.description,
        url: data.url || undefined,
        remote: data.remote,
        tags: data.tags || undefined,
        salary: data.salary || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setSubmitted(true);
      toast({
        title: "Job Posted Successfully",
        description: "Your job listing is now live on Dev Global Jobs.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Post Job",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.location || !formData.description) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate(formData);
  };

  const handleChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-16 flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Job Posted Successfully</h1>
            <p className="text-muted-foreground text-lg">
              Your job listing is now live and visible to millions of job seekers worldwide.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" onClick={() => setLocation("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
              <Button onClick={() => { setSubmitted(false); setFormData({ title: "", company: "", location: "", description: "", url: "", remote: false, tags: "", salary: "" }); }}>
                Post Another Job
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header />
      
      <div className="container mx-auto max-w-3xl px-4 py-8 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-display">Post a Job</h1>
            <p className="text-muted-foreground text-lg">
              Reach millions of qualified candidates across 193 countries
            </p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Job Details
              </CardTitle>
              <CardDescription>
                Fill in the details below to create your job listing. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Job Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Software Engineer"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      required
                      data-testid="input-job-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      placeholder="e.g., Tech Corp International"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      required
                      data-testid="input-company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, USA or Remote"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      required
                      data-testid="input-location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Salary Range
                    </Label>
                    <Input
                      id="salary"
                      placeholder="e.g., $80,000 - $120,000"
                      value={formData.salary}
                      onChange={(e) => handleChange("salary", e.target.value)}
                      data-testid="input-salary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    Job Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, requirements, and benefits..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="min-h-[200px]"
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="url" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Application URL
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://yourcompany.com/careers/apply"
                      value={formData.url}
                      onChange={(e) => handleChange("url", e.target.value)}
                      data-testid="input-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags (comma separated)
                    </Label>
                    <Input
                      id="tags"
                      placeholder="e.g., JavaScript, React, Remote"
                      value={formData.tags}
                      onChange={(e) => handleChange("tags", e.target.value)}
                      data-testid="input-tags"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Switch
                    id="remote"
                    checked={formData.remote}
                    onCheckedChange={(checked) => handleChange("remote", checked)}
                    data-testid="switch-remote"
                  />
                  <Label htmlFor="remote" className="cursor-pointer flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    This is a remote position
                  </Label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 shadow-lg shadow-primary/20"
                    disabled={createJobMutation.isPending}
                    data-testid="button-submit-job"
                  >
                    {createJobMutation.isPending ? "Posting..." : "Post Job"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            By posting a job, you agree to our{" "}
            <a href="https://devglobaljobs.com/terms-and-conditions/" className="text-primary hover:underline">
              Terms and Conditions
            </a>
            {" "}and{" "}
            <a href="https://devglobaljobs.com/privacy-policy/" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
