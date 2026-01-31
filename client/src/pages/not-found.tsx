import { Link } from "wouter";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-xl text-muted-foreground">Page Not Found</h2>
          </div>
          
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link href="/">
            <Button data-testid="button-return-home">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
