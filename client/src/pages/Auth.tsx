import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Globe, User, Briefcase, ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { SiGoogle, SiApple, SiGithub } from "react-icons/si";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, signup, verifyCode, resendCode } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"recruiter" | "jobseeker">("jobseeker");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState<number | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await signup(email, password, role, firstName, lastName, gender, city);
      }
      
      if (result?.requiresVerification) {
        setVerificationUserId(result.userId);
        setVerificationEmail(result.email);
        setShowVerification(true);
        toast({ 
          title: "Verification Required", 
          description: "Please check your email for a verification code." 
        });
        return;
      }
      
      toast({ 
        title: isLogin ? "Welcome back!" : "Account created!", 
        description: isLogin ? "You have successfully logged in." : "Welcome to Dev Global Jobs." 
      });
      
      if (role === "recruiter") {
        setLocation("/profile");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationUserId) return;
    
    setIsLoading(true);
    try {
      await verifyCode(verificationUserId, verificationCode);
      toast({ 
        title: "Email Verified!", 
        description: "Your account has been verified successfully." 
      });
      
      if (role === "recruiter") {
        setLocation("/profile");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationUserId) return;
    
    setIsResending(true);
    try {
      await resendCode(verificationUserId);
      toast({ 
        title: "Code Sent", 
        description: "A new verification code has been sent to your email." 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Verification Code UI
  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600">
              <Globe className="w-8 h-8" />
              Dev Global Jobs
            </a>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle data-testid="text-verify-title">Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a 6-digit verification code to<br />
                <span className="font-medium text-foreground">{verificationEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    data-testid="input-verification-code"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || verificationCode.length !== 6}
                  data-testid="button-verify"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="gap-2"
                  data-testid="button-resend-code"
                >
                  <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationCode("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </Card>
          
          <p className="mt-4 text-center text-xs text-muted-foreground">
            The code expires in 15 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Globe className="w-8 h-8" />
            Dev Global Jobs
          </a>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-auth-title">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Log in to access your account" 
                : "Sign up to post jobs or apply for positions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        data-testid="select-gender"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        data-testid="input-city"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={role === "jobseeker" ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => setRole("jobseeker")}
                        data-testid="button-role-jobseeker"
                      >
                        <User className="h-6 w-6" />
                        <span>Job Seeker</span>
                      </Button>
                      <Button
                        type="button"
                        variant={role === "recruiter" ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => setRole("recruiter")}
                        data-testid="button-role-recruiter"
                      >
                        <Briefcase className="h-6 w-6" />
                        <span>Recruiter</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-auth"
              >
                {isLoading ? "Please wait..." : (isLogin ? "Log In" : "Create Account")}
              </Button>
            </form>
            
            {/* Social Login Options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2 mt-4"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-social-login"
              >
                <Globe className="w-5 h-5" />
                Continue with Google, Apple, X or GitHub
              </Button>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground">
                <SiGoogle className="w-4 h-4" />
                <SiApple className="w-4 h-4" />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <SiGithub className="w-4 h-4" />
              </div>
              
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Choose your preferred sign-in method on the next screen
              </p>
            </div>
            
            <div className="mt-6 text-center text-sm">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 hover:underline font-medium"
                    data-testid="button-switch-signup"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-blue-600 hover:underline font-medium"
                    data-testid="button-switch-login"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
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
