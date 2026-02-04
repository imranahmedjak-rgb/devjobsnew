import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, DollarSign, Tag, Globe, ArrowLeft, CheckCircle, Mail, Link as LinkIcon, Building, Users, Shield, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface JobFormData {
  title: string;
  companyName: string;
  location: string;
  description: string;
  category: string;
  applyMethod: "link" | "email";
  applyValue: string;
  remote: boolean;
  tags: string;
  salary: string;
}

export default function PostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    companyName: "",
    location: "",
    description: "",
    category: "",
    applyMethod: "link",
    applyValue: "",
    remote: false,
    tags: "",
    salary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.companyName || !formData.location || !formData.description || !formData.category || !formData.applyValue) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.applyMethod === "link" && !formData.applyValue.startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    if (formData.applyMethod === "email" && !formData.applyValue.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem("pendingJobData", JSON.stringify(formData));

      const res = await fetch("/api/stripe/create-job-payment-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobData: {
            title: formData.title,
            company: formData.companyName,
            location: formData.location,
            description: formData.description,
            category: formData.category,
            applyMethod: formData.applyMethod,
            applyValue: formData.applyValue,
            remote: formData.remote,
            tags: formData.tags,
            salary: formData.salary,
          },
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to create payment session";
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = "Server error. Please try again.";
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const { url } = data;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Initiate Payment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold" data-testid="text-success">Job Posted Successfully</h1>
            <p className="text-muted-foreground text-lg">
              Your job listing is now live and visible to job seekers worldwide.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
              <p className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                <Shield className="w-4 h-4" />
                Source: Direct - Dev Global Jobs
              </p>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
              <Button onClick={() => { setSubmitted(false); setFormData({ title: "", companyName: "", location: "", description: "", category: "", applyMethod: "link", applyValue: "", remote: false, tags: "", salary: "" }); }} data-testid="button-post-another">
                Post Another Job
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
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
              Reach qualified candidates worldwide
            </p>
          </div>

          <Card className="border-border/50 shadow-xl" data-testid="post-job-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Job Details
              </CardTitle>
              <CardDescription>
                Fill in the details below. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Job Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(v) => handleChange("category", v)} required>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          UN Jobs
                        </span>
                      </SelectItem>
                      <SelectItem value="ngo">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          NGO Jobs
                        </span>
                      </SelectItem>
                      <SelectItem value="remote">
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-purple-600" />
                          Remote Jobs
                        </span>
                      </SelectItem>
                      <SelectItem value="international">
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-orange-600" />
                          International Jobs
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Organization Name *
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., UNICEF, World Vision, Save the Children"
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    required
                    data-testid="input-company-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Program Manager, Software Engineer"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                    data-testid="input-job-title"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Geneva, Switzerland"
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
                  <Label htmlFor="description">
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

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Label className="text-base font-medium">Application Method *</Label>
                  <RadioGroup 
                    value={formData.applyMethod} 
                    onValueChange={(v) => handleChange("applyMethod", v as "link" | "email")}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="link" id="apply-link" data-testid="radio-apply-link" />
                      <Label htmlFor="apply-link" className="flex items-center gap-2 cursor-pointer">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        Apply via Link (redirect to external URL)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="email" id="apply-email" data-testid="radio-apply-email" />
                      <Label htmlFor="apply-email" className="flex items-center gap-2 cursor-pointer">
                        <Mail className="w-4 h-4 text-green-600" />
                        Apply via Email (send applications to email)
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="pt-2">
                    {formData.applyMethod === "link" ? (
                      <Input
                        placeholder="https://yourcompany.com/careers/apply"
                        value={formData.applyValue}
                        onChange={(e) => handleChange("applyValue", e.target.value)}
                        required
                        data-testid="input-apply-value"
                      />
                    ) : (
                      <Input
                        type="email"
                        placeholder="careers@yourorganization.org"
                        value={formData.applyValue}
                        onChange={(e) => handleChange("applyValue", e.target.value)}
                        required
                        data-testid="input-apply-value"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.applyMethod === "link" 
                        ? "Candidates will be redirected to this URL to apply"
                        : "Candidates will send their applications to this email"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags (comma separated)
                  </Label>
                  <Input
                    id="tags"
                    placeholder="e.g., Development, Remote, Management"
                    value={formData.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    data-testid="input-tags"
                  />
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

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="font-medium">Job Posting Fee</span>
                    </div>
                    <span className="text-2xl font-bold text-primary" data-testid="text-price">$10.00 USD</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    One-time payment to publish your job listing worldwide
                  </p>
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
                    disabled={isSubmitting}
                    data-testid="button-submit-job"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Processing..." : "Pay $10 & Post Job"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            By posting a job, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline" data-testid="link-terms">
              Terms and Conditions
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
              Privacy Policy
            </Link>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
