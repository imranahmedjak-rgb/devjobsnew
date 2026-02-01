import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth, apiRequest } from "@/lib/auth";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, Briefcase, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [, setLocationPath] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobCreated, setJobCreated] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocationPath("/auth");
      return;
    }

    if (!authLoading && user) {
      verifyPaymentAndCreateJob();
    }
  }, [user, authLoading]);

  const verifyPaymentAndCreateJob = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setError("No payment session found");
      setIsProcessing(false);
      return;
    }

    try {
      const res = await apiRequest("/api/stripe/verify-payment", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Payment verification failed");
      }

      localStorage.removeItem("pendingJobData");
      setJobCreated(true);
      toast({
        title: "Job Posted Successfully",
        description: "Your job listing is now live on Dev Global Jobs.",
      });
    } catch (err: any) {
      console.error("Payment verification error:", err);
      setError(err.message || "Failed to verify payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Processing your payment...</p>
            <p className="text-sm text-muted-foreground">Please wait while we verify your payment and create your job listing.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-16 flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-error">Payment Error</h1>
            <p className="text-muted-foreground text-lg">{error}</p>
            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" onClick={() => setLocationPath("/")} data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
              <Button onClick={() => setLocationPath("/post-job")} data-testid="button-try-again">
                <Briefcase className="w-4 h-4 mr-2" />
                Try Again
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
      <div className="container mx-auto max-w-2xl px-4 py-16 flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-success">Payment Successful</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your payment! Your job listing is now live and visible to job seekers worldwide.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-green-700 dark:text-green-300 font-medium">
              $2.00 USD payment received
            </p>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="outline" onClick={() => setLocationPath("/")} data-testid="button-view-jobs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View All Jobs
            </Button>
            <Button onClick={() => setLocationPath("/post-job")} data-testid="button-post-another">
              <Briefcase className="w-4 h-4 mr-2" />
              Post Another Job
            </Button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
