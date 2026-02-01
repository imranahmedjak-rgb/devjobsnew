import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Disclaimer</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto max-w-4xl px-4 py-12">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            {/* Important Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Important Notice</h3>
                <p className="text-muted-foreground text-sm">
                  Please read this disclaimer carefully before using Dev Global Jobs. By accessing our platform, you acknowledge that you have read, understood, and agree to be bound by this disclaimer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">General Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dev Global Jobs is operated by Trend Nova World Ltd. The information provided on this website is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the website.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Job Listings Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                Job listings displayed on Dev Global Jobs are aggregated from third-party sources and external websites. We do not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Verify the accuracy of job listings or employer information</li>
                <li>Guarantee the availability or legitimacy of any job posting</li>
                <li>Endorse any employer, organization, or job opportunity</li>
                <li>Have any employment relationship with users or employers</li>
                <li>Guarantee employment outcomes for any applicant</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Users are strongly advised to verify all job details, employer credentials, and application requirements directly with the hiring organization before applying or providing personal information.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">No Employment Relationship</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dev Global Jobs acts solely as an aggregator and information platform. We are not a recruitment agency, employer, or employment service. Any relationship formed between job seekers and employers through our platform is exclusively between those parties. We bear no responsibility for hiring decisions, employment terms, or workplace conditions.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">External Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website contains links to external websites that are not operated by us. We have no control over the content, privacy policies, or practices of any third-party sites or services. Clicking on external links is done at your own risk. We encourage you to review the terms and privacy policies of any website you visit.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by applicable law, Trend Nova World Ltd. and its affiliates, officers, employees, agents, and partners shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Any loss or damage arising from the use of our website</li>
                <li>Any fraudulent job postings or employment scams</li>
                <li>Any decisions made based on information found on our platform</li>
                <li>Any interruption or cessation of our services</li>
                <li>Any viruses or other harmful components transmitted through our website</li>
                <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Accuracy of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we make every effort to ensure that the information on our website is accurate and up-to-date, job listings may become outdated, positions may be filled, or details may change without notice. We recommend verifying all information with the original source before taking any action.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Professional Advice</h2>
              <p className="text-muted-foreground leading-relaxed">
                The content on this website does not constitute professional, legal, or career advice. Users should seek appropriate professional guidance for specific career decisions, immigration matters, or legal questions related to employment.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Changes to This Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify this disclaimer at any time without prior notice. Changes will be effective immediately upon posting on the website. Your continued use of the website after any changes constitutes acceptance of the modified disclaimer.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this disclaimer, please contact us:
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
