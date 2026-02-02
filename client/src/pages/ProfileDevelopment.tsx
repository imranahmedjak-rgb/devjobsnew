import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Briefcase, Award, FolderOpen, Users, FileText, Sparkles, 
  Plus, Trash2, ChevronLeft, ChevronRight, Check, ArrowLeft, Download
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type WizardStep = "personal" | "experience" | "achievements" | "projects" | "references" | "review";

const steps: { id: WizardStep; label: string; icon: any }[] = [
  { id: "personal", label: "Personal Details", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "references", label: "References", icon: Users },
  { id: "review", label: "Review & CV", icon: FileText },
];

export default function ProfileDevelopment() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>("personal");
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const [personalData, setPersonalData] = useState({
    name: "",
    country: "",
    phone: "",
    nationality: "",
    linkedinUrl: "",
    portfolioUrl: "",
    professionalSummary: "",
    currentJobTitle: "",
    yearsOfExperience: 0,
    skills: [] as string[],
    languages: [] as string[],
    education: "",
    certifications: "",
  });
  
  const [newExperience, setNewExperience] = useState({
    jobTitle: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });
  
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    role: "",
    technologies: [] as string[],
    projectUrl: "",
  });
  
  const [newReference, setNewReference] = useState({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    relationship: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [techInput, setTechInput] = useState("");

  const { data: fullProfile, isLoading: profileLoading } = useQuery<{
    profile: any;
    experiences: any[];
    achievements: any[];
    projects: any[];
    references: any[];
  }>({
    queryKey: ["/api/candidate/full-profile"],
    queryFn: async () => {
      const res = await apiRequest("/api/candidate/full-profile");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (fullProfile?.profile) {
      setPersonalData({
        name: fullProfile.profile.name || "",
        country: fullProfile.profile.country || "",
        phone: fullProfile.profile.phone || "",
        nationality: fullProfile.profile.nationality || "",
        linkedinUrl: fullProfile.profile.linkedinUrl || "",
        portfolioUrl: fullProfile.profile.portfolioUrl || "",
        professionalSummary: fullProfile.profile.professionalSummary || "",
        currentJobTitle: fullProfile.profile.currentJobTitle || "",
        yearsOfExperience: fullProfile.profile.yearsOfExperience || 0,
        skills: fullProfile.profile.skills || [],
        languages: fullProfile.profile.languages || [],
        education: fullProfile.profile.education || "",
        certifications: fullProfile.profile.certifications || "",
      });
    }
  }, [fullProfile]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof personalData) => {
      const res = await apiRequest("/api/candidate/profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
      toast({ title: "Profile saved!" });
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const addExperienceMutation = useMutation({
    mutationFn: async (data: typeof newExperience) => {
      const res = await apiRequest("/api/candidate/experiences", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add experience");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
      setNewExperience({ jobTitle: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" });
      toast({ title: "Experience added!" });
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/candidate/experiences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      const res = await apiRequest("/api/candidate/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
      setNewProject({ title: "", description: "", role: "", technologies: [], projectUrl: "" });
      toast({ title: "Project added!" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/candidate/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
    },
  });

  const addReferenceMutation = useMutation({
    mutationFn: async (data: typeof newReference) => {
      const res = await apiRequest("/api/candidate/references", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add reference");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
      setNewReference({ name: "", title: "", company: "", email: "", phone: "", relationship: "" });
      toast({ title: "Reference added!" });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/candidate/references/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
    },
  });

  const generateAchievementsMutation = useMutation({
    mutationFn: async (experienceId: number) => {
      const res = await apiRequest("/api/ai/generate-achievements", {
        method: "POST",
        body: JSON.stringify({ experienceId }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/full-profile"] });
      toast({ title: "AI achievements generated!" });
    },
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "jobseeker") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Profile Development is only available for job seekers. Please sign in with a job seeker account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/auth")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !personalData.skills.includes(skillInput.trim())) {
      setPersonalData({ ...personalData, skills: [...personalData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !personalData.languages.includes(languageInput.trim())) {
      setPersonalData({ ...personalData, languages: [...personalData.languages, languageInput.trim()] });
      setLanguageInput("");
    }
  };

  const handleAddTech = () => {
    if (techInput.trim() && !newProject.technologies.includes(techInput.trim())) {
      setNewProject({ ...newProject, technologies: [...newProject.technologies, techInput.trim()] });
      setTechInput("");
    }
  };

  const nextStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx < steps.length - 1) {
      if (currentStep === "personal") {
        saveProfileMutation.mutate(personalData);
      }
      setCurrentStep(steps[idx + 1].id);
    }
  };

  const prevStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </a>
          <h1 className="text-3xl font-bold mb-2">Profile Development</h1>
          <p className="text-muted-foreground">Build your professional profile step by step</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStepIndex + 1} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = idx < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : 
                    isCompleted ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`step-${step.id}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs hidden sm:block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStepIndex].icon;
                return StepIcon ? <StepIcon className="h-5 w-5" /> : null;
              })()}
              {steps[currentStepIndex].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={personalData.name}
                      onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                      placeholder="John Doe"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentJobTitle">Current Job Title</Label>
                    <Input
                      id="currentJobTitle"
                      value={personalData.currentJobTitle}
                      onChange={(e) => setPersonalData({ ...personalData, currentJobTitle: e.target.value })}
                      placeholder="Senior Software Engineer"
                      data-testid="input-job-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={personalData.country}
                      onChange={(e) => setPersonalData({ ...personalData, country: e.target.value })}
                      placeholder="United Kingdom"
                      data-testid="input-country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={personalData.nationality}
                      onChange={(e) => setPersonalData({ ...personalData, nationality: e.target.value })}
                      placeholder="British"
                      data-testid="input-nationality"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                      placeholder="+44 123 456 7890"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      value={personalData.yearsOfExperience}
                      onChange={(e) => setPersonalData({ ...personalData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      data-testid="input-years-experience"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      value={personalData.linkedinUrl}
                      onChange={(e) => setPersonalData({ ...personalData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                      data-testid="input-linkedin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      value={personalData.portfolioUrl}
                      onChange={(e) => setPersonalData({ ...personalData, portfolioUrl: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      data-testid="input-portfolio"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="professionalSummary">Professional Summary</Label>
                  <Textarea
                    id="professionalSummary"
                    value={personalData.professionalSummary}
                    onChange={(e) => setPersonalData({ ...personalData, professionalSummary: e.target.value })}
                    placeholder="A brief summary of your professional background and career objectives..."
                    rows={4}
                    data-testid="input-summary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      data-testid="input-skill"
                    />
                    <Button type="button" onClick={handleAddSkill} size="sm" data-testid="button-add-skill">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personalData.skills.map((skill, i) => (
                      <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {skill}
                        <button onClick={() => setPersonalData({ ...personalData, skills: personalData.skills.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex gap-2">
                    <Input
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="Add a language"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLanguage())}
                      data-testid="input-language"
                    />
                    <Button type="button" onClick={handleAddLanguage} size="sm" data-testid="button-add-language">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personalData.languages.map((lang, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {lang}
                        <button onClick={() => setPersonalData({ ...personalData, languages: personalData.languages.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={personalData.education}
                    onChange={(e) => setPersonalData({ ...personalData, education: e.target.value })}
                    placeholder="Your educational background..."
                    rows={3}
                    data-testid="input-education"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Textarea
                    id="certifications"
                    value={personalData.certifications}
                    onChange={(e) => setPersonalData({ ...personalData, certifications: e.target.value })}
                    placeholder="Professional certifications..."
                    rows={2}
                    data-testid="input-certifications"
                  />
                </div>
              </div>
            )}

            {currentStep === "experience" && (
              <div className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Add New Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={newExperience.jobTitle}
                        onChange={(e) => setNewExperience({ ...newExperience, jobTitle: e.target.value })}
                        placeholder="Senior Developer"
                        data-testid="input-exp-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        placeholder="Tech Company Ltd"
                        data-testid="input-exp-company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={newExperience.location}
                        onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                        placeholder="London, UK"
                        data-testid="input-exp-location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                        data-testid="input-exp-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                        disabled={newExperience.isCurrent}
                        data-testid="input-exp-end"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="isCurrent"
                        checked={newExperience.isCurrent}
                        onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked, endDate: "" })}
                        data-testid="checkbox-current"
                      />
                      <Label htmlFor="isCurrent">I currently work here</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={4}
                      data-testid="input-exp-description"
                    />
                  </div>
                  <Button 
                    onClick={() => addExperienceMutation.mutate(newExperience)}
                    disabled={!newExperience.jobTitle || !newExperience.company || addExperienceMutation.isPending}
                    data-testid="button-add-experience"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Your Experience</h3>
                  {fullProfile?.experiences?.length === 0 && (
                    <p className="text-muted-foreground text-sm">No experience added yet.</p>
                  )}
                  {fullProfile?.experiences?.map((exp: any) => (
                    <div key={exp.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{exp.jobTitle}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company} - {exp.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                          </p>
                          {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateAchievementsMutation.mutate(exp.id)}
                            disabled={generateAchievementsMutation.isPending}
                            data-testid={`button-generate-achievements-${exp.id}`}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Achievements
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExperienceMutation.mutate(exp.id)}
                            data-testid={`button-delete-exp-${exp.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "achievements" && (
              <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">AI-Powered Achievements</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The AI will automatically suggest 5-10 achievements based on your job titles and experience. 
                    All suggestions are ATS-optimized and aligned with international recruitment standards.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Your Achievements</h3>
                  {fullProfile?.achievements?.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No achievements yet. Go to the Experience step and click "AI Achievements" to generate suggestions.
                    </p>
                  )}
                  {fullProfile?.achievements?.map((ach: any) => (
                    <div key={ach.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {ach.title}
                            {ach.isAiGenerated && (
                              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">AI Generated</span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{ach.description}</p>
                          {ach.metrics && <p className="text-xs text-primary mt-1">{ach.metrics}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReferenceMutation.mutate(ach.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "projects" && (
              <div className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Add New Project</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        placeholder="E-commerce Platform"
                        data-testid="input-project-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Role</Label>
                      <Input
                        value={newProject.role}
                        onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                        placeholder="Lead Developer"
                        data-testid="input-project-role"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Project URL</Label>
                      <Input
                        value={newProject.projectUrl}
                        onChange={(e) => setNewProject({ ...newProject, projectUrl: e.target.value })}
                        placeholder="https://github.com/your-project"
                        data-testid="input-project-url"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Describe the project and your contributions..."
                      rows={3}
                      data-testid="input-project-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <div className="flex gap-2">
                      <Input
                        value={techInput}
                        onChange={(e) => setTechInput(e.target.value)}
                        placeholder="Add a technology"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                        data-testid="input-project-tech"
                      />
                      <Button type="button" onClick={handleAddTech} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newProject.technologies.map((tech, i) => (
                        <span key={i} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          {tech}
                          <button onClick={() => setNewProject({ ...newProject, technologies: newProject.technologies.filter((_, j) => j !== i) })}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={() => addProjectMutation.mutate(newProject)}
                    disabled={!newProject.title || !newProject.description || addProjectMutation.isPending}
                    data-testid="button-add-project"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Your Projects</h3>
                  {fullProfile?.projects?.length === 0 && (
                    <p className="text-muted-foreground text-sm">No projects added yet.</p>
                  )}
                  {fullProfile?.projects?.map((proj: any) => (
                    <div key={proj.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{proj.title}</h4>
                          {proj.role && <p className="text-sm text-primary">{proj.role}</p>}
                          <p className="text-sm text-muted-foreground mt-1">{proj.description}</p>
                          {proj.technologies?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.technologies.map((t: string, i: number) => (
                                <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProjectMutation.mutate(proj.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "references" && (
              <div className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Add New Reference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newReference.name}
                        onChange={(e) => setNewReference({ ...newReference, name: e.target.value })}
                        placeholder="John Smith"
                        data-testid="input-ref-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={newReference.title}
                        onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                        placeholder="Senior Manager"
                        data-testid="input-ref-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={newReference.company}
                        onChange={(e) => setNewReference({ ...newReference, company: e.target.value })}
                        placeholder="Tech Company Ltd"
                        data-testid="input-ref-company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input
                        value={newReference.relationship}
                        onChange={(e) => setNewReference({ ...newReference, relationship: e.target.value })}
                        placeholder="Former Manager"
                        data-testid="input-ref-relationship"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newReference.email}
                        onChange={(e) => setNewReference({ ...newReference, email: e.target.value })}
                        placeholder="john@company.com"
                        data-testid="input-ref-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newReference.phone}
                        onChange={(e) => setNewReference({ ...newReference, phone: e.target.value })}
                        placeholder="+44 123 456 7890"
                        data-testid="input-ref-phone"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => addReferenceMutation.mutate(newReference)}
                    disabled={!newReference.name || !newReference.title || !newReference.company || addReferenceMutation.isPending}
                    data-testid="button-add-reference"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reference
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Your References</h3>
                  {fullProfile?.references?.length === 0 && (
                    <p className="text-muted-foreground text-sm">No references added yet.</p>
                  )}
                  {fullProfile?.references?.map((ref: any) => (
                    <div key={ref.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{ref.name}</h4>
                          <p className="text-sm text-muted-foreground">{ref.title} at {ref.company}</p>
                          {ref.relationship && <p className="text-xs text-primary">{ref.relationship}</p>}
                          <div className="text-xs text-muted-foreground mt-1">
                            {ref.email && <span>{ref.email}</span>}
                            {ref.email && ref.phone && <span> | </span>}
                            {ref.phone && <span>{ref.phone}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReferenceMutation.mutate(ref.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800 dark:text-green-200">Profile Complete!</h3>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your professional profile is ready. You can now download your CV or use Easy Apply for job applications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {personalData.name || "Not set"}</p>
                      <p><strong>Title:</strong> {personalData.currentJobTitle || "Not set"}</p>
                      <p><strong>Experience:</strong> {personalData.yearsOfExperience} years</p>
                      <p><strong>Experiences:</strong> {fullProfile?.experiences?.length || 0}</p>
                      <p><strong>Achievements:</strong> {fullProfile?.achievements?.length || 0}</p>
                      <p><strong>Projects:</strong> {fullProfile?.projects?.length || 0}</p>
                      <p><strong>References:</strong> {fullProfile?.references?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" data-testid="button-download-cv">
                        <Download className="h-4 w-4 mr-2" />
                        Download CV (British Format)
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
                        Browse Jobs with Easy Apply
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                data-testid="button-prev-step"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStepIndex === steps.length - 1}
                data-testid="button-next-step"
              >
                {currentStepIndex === steps.length - 2 ? "Complete" : "Next"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
