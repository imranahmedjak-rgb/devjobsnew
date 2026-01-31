import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, BarChart3, Shield } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto max-w-4xl px-4 py-12">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners. Cookies help us provide you with a better experience by enabling us to monitor which pages you find useful and which you do not.
              </p>
            </div>

            {/* Types of Cookies */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Types of Cookies We Use</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Essential Cookies</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Analytics Cookies</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Settings className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Functional Cookies</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Cookie className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">Third-Party Cookies</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Some pages may contain content from third-party services which may set their own cookies. We do not control these cookies.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve our website's performance and functionality</li>
                <li>Provide personalized content and recommendations</li>
                <li>Analyze website traffic and usage patterns</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies in various ways. Most web browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from particular websites</li>
                <li>Block all cookies from being set</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Please note that if you choose to block or delete cookies, some features of our website may not function properly.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Browser Settings</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can manage cookies through your browser settings. Here are links to cookie management instructions for popular browsers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Safari</li>
                <li>Microsoft Edge</li>
                <li>Opera</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Email:</strong> info@devglobaljobs.com</p>
                <p><strong className="text-foreground">Company:</strong> Trend Nova World Ltd.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
