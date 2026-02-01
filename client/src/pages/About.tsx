import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, Target, Award, Building2, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connecting global talent with international opportunities across UN agencies, NGOs, and professional organizations worldwide.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
          {/* Who We Are */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Who We Are</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              CareerNest is an international job aggregation platform operated by Trend Nova World Ltd. We specialize in connecting professionals with career opportunities in the development sector, humanitarian organizations, and international institutions. Our platform serves as a bridge between talented individuals and organizations making a difference globally.
            </p>
          </div>

          {/* Our Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Our mission is to democratize access to international career opportunities. We believe that talented professionals from all backgrounds should have equal access to meaningful work at organizations driving positive global change. By aggregating job listings from trusted sources, we save job seekers time and help them discover opportunities they might otherwise miss.
            </p>
          </div>

          {/* What We Offer */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">What We Offer</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <Globe className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="font-semibold">UN Agency Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    Opportunities at United Nations agencies, World Bank, IMF, and international development banks.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <Heart className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="font-semibold">NGO Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    Positions at humanitarian organizations, INGOs, and civil society organizations worldwide.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <Users className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="font-semibold">International Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional opportunities across IT, finance, hospitality, consulting, and all global sectors.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Our Values */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Values</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span><strong className="text-foreground">Transparency:</strong> We only list verified job opportunities with direct application links.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span><strong className="text-foreground">Accessibility:</strong> Our platform is free to use and accessible to professionals worldwide.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span><strong className="text-foreground">Quality:</strong> We aggregate jobs from trusted sources and update listings in real-time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                <span><strong className="text-foreground">Global Reach:</strong> We cover opportunities in 100+ countries across all continents.</span>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-4">Company Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Company:</strong> Trend Nova World Ltd.</p>
              <p><strong className="text-foreground">Platform:</strong> CareerNest</p>
              <p><strong className="text-foreground">Website:</strong> careernest.com</p>
              <p><strong className="text-foreground">Email:</strong> info@careernest.com</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
