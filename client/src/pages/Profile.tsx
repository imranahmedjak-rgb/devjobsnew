import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, apiRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Globe, ArrowLeft, Building, User, Save, LogOut, Briefcase } from "lucide-react";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", 
  "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", "Czech Republic", "Denmark", 
  "Egypt", "Ethiopia", "Finland", "France", "Germany", "Ghana", "Greece", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya", "Lebanon",
  "Malaysia", "Mexico", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Syria", "Thailand", "Turkey", "UAE", "Uganda", "Ukraine", "United Kingdom", "United States",
  "Venezuela", "Vietnam", "Yemen", "Zimbabwe"
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Recruiter fields
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  
  // Job seeker fields
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [expertise, setExpertise] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
      return;
    }
    
    if (user) {
      loadProfile();
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === "recruiter" ? "/api/recruiter/profile" : "/api/jobseeker/profile";
      const res = await apiRequest(endpoint);
      
      if (res.ok) {
        const profile = await res.json();
        if (profile) {
          if (user?.role === "recruiter") {
            setOrganizationName(profile.organizationName || "");
            setContactEmail(profile.contactEmail || user.email);
            setCountry(profile.country || "");
            setDescription(profile.description || "");
          } else {
            setName(profile.name || "");
            setCountry(profile.country || "");
            setExperience(profile.experience || "");
            setExpertise(profile.expertise || "");
          }
        } else {
          // Set default values for new profile
          if (user?.role === "recruiter") {
            setContactEmail(user.email);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const endpoint = user?.role === "recruiter" ? "/api/recruiter/profile" : "/api/jobseeker/profile";
      const body = user?.role === "recruiter" 
        ? { organizationName, contactEmail, country, description }
        : { name, country, experience, expertise };
      
      const res = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save profile");
      }
      
      toast({ title: "Profile saved!", description: "Your profile has been updated successfully." });
      
      if (user?.role === "recruiter") {
        setLocation("/post-job");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Globe className="w-8 h-8" />
            Dev Global Jobs
          </a>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {user?.role === "recruiter" ? (
                <Building className="h-8 w-8 text-blue-600" />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
              <div>
                <CardTitle data-testid="text-profile-title">
                  {user?.role === "recruiter" ? "Recruiter Profile" : "Job Seeker Profile"}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {user?.role === "recruiter" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization / Company Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="Your organization name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                      data-testid="input-org-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@organization.org"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={country} onValueChange={setCountry} required>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Organization Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your organization..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      data-testid="input-description"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={country} onValueChange={setCountry} required>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      placeholder="Describe your work experience..."
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      rows={3}
                      data-testid="input-experience"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Areas of Expertise</Label>
                    <Textarea
                      id="expertise"
                      placeholder="Your key skills and expertise areas..."
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      rows={3}
                      data-testid="input-expertise"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSaving} data-testid="button-save-profile">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
                
                {user?.role === "recruiter" && (
                  <Button type="button" variant="outline" onClick={() => setLocation("/post-job")} data-testid="button-post-job">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            data-testid="link-back-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </a>
        </div>
      </div>
    </div>
  );
}
