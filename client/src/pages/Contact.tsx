import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help. Reach out to us through any of the channels below.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="container mx-auto max-w-5xl px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Get In Touch</h2>
              <p className="text-muted-foreground">
                Whether you have questions about our platform, want to publish job listings, or need support, our team is ready to assist you.
              </p>

              <div className="space-y-4">
                <Card className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">General Inquiries</h3>
                      <a href="mailto:info@devglobaljobs.com" className="text-primary hover:underline">
                        info@devglobaljobs.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Job Publishing</h3>
                      <a href="mailto:publication@devglobaljobs.com" className="text-primary hover:underline">
                        publication@devglobaljobs.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Phone (UK)</h3>
                      <a href="tel:+447473863903" className="text-primary hover:underline">
                        +44 7473 863903
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <FaWhatsapp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">WhatsApp (Publications)</h3>
                      <a href="https://wa.me/994518673521" target="_blank" className="text-green-500 hover:underline">
                        +994 51 867 35 21
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Response Time</h3>
                      <p className="text-muted-foreground text-sm">
                        We typically respond within 24-48 business hours
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" data-testid="input-first-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" data-testid="input-last-name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" data-testid="input-subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Your message..." 
                    rows={5}
                    data-testid="input-message"
                  />
                </div>
                <Button className="w-full" data-testid="button-send-message">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By sending a message, you agree to our Privacy Policy and Terms of Service.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
