import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms and Conditions</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto max-w-4xl px-4 py-12">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using CareerNest (the "Platform"), operated by Trend Nova World Ltd., you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Platform.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                CareerNest is a job aggregation platform that collects and displays job listings from various external sources. We do not directly employ or recruit candidates. Our service is designed to help job seekers discover opportunities at UN agencies, NGOs, and international organizations.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">Users of our Platform agree to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and truthful information when using our services</li>
                <li>Not misuse the Platform or attempt to gain unauthorized access</li>
                <li>Not reproduce, duplicate, or exploit any part of the Platform without permission</li>
                <li>Apply for jobs through the original source links provided</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">4. Job Listings</h2>
              <p className="text-muted-foreground leading-relaxed">
                Job listings displayed on our Platform are aggregated from third-party sources. While we strive to ensure accuracy, we do not guarantee the completeness, reliability, or availability of any job listing. Users should verify all job details directly with the hiring organization before applying.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this Platform, including but not limited to text, graphics, logos, and software, is the property of Trend Nova World Ltd. or its content suppliers and is protected by intellectual property laws. Job listing content belongs to the respective employers and sources.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                CareerNest and Trend Nova World Ltd. shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Platform. This includes, but is not limited to, damages resulting from job applications, employment decisions, or reliance on information provided on the Platform.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">7. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Platform contains links to external websites and job listings. We are not responsible for the content, privacy practices, or availability of these third-party sites. Accessing these links is at your own risk.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">8. Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the Platform. Your continued use of the Platform after changes constitutes acceptance of the modified terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the United Kingdom. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of the United Kingdom.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Email:</strong> info@careernest.com</p>
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
