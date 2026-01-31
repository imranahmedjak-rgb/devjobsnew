import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto max-w-4xl px-4 py-12">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trend Nova World Ltd. ("we", "our", "us") operates Dev Global Jobs. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this policy carefully.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">We may collect information about you in various ways:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Personal Data:</strong> Name, email address, and contact information when you reach out to us</li>
                <li><strong className="text-foreground">Usage Data:</strong> Information about how you use our website, including pages visited and time spent</li>
                <li><strong className="text-foreground">Device Data:</strong> Browser type, IP address, operating system, and device identifiers</li>
                <li><strong className="text-foreground">Cookies:</strong> Small data files stored on your device to enhance your experience</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Understand and analyze how you use our website</li>
                <li>Communicate with you for customer service and updates</li>
                <li>Process job publishing requests and inquiries</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">4. Sharing Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>With service providers who assist in operating our website</li>
                <li>To comply with legal obligations or respond to lawful requests</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal data we hold</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">7. Third-Party Websites</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website contains links to third-party websites, including job listings on external platforms. We are not responsible for the privacy practices of these websites. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If we learn we have collected personal information from a child, we will delete it promptly.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated revision date. Your continued use of the website after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us:
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
