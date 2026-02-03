import { Link } from "wouter";
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Globe, Building2, Mail, Phone, FileText, Shield, Cookie, AlertCircle, Users, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Widget 1: About */}
        <div className="space-y-4">
          <h3 className="text-white text-2xl font-bold tracking-tight">
            Dev Global<span className="text-primary">Jobs</span>
          </h3>
          <span className="text-primary text-xs font-semibold block">
            Associated with Trend Nova World Ltd.
          </span>
          <p className="text-sm leading-relaxed text-slate-400">
            Dev Global Jobs is an international job aggregation platform by Trend Nova World Limited. We feature opportunities across three categories: UN Jobs from United Nations and international organizations, NGO Jobs from humanitarian and nonprofit sectors, and International Jobs spanning technology, finance, healthcare, consulting, and engineering from 200+ global sources across 193 countries.
          </p>
          <div className="flex justify-center md:justify-start gap-3 pt-2">
            <a 
              href="https://www.facebook.com/trendnovaworld" 
              target="_blank" 
              className="w-9 h-9 bg-slate-800 hover:bg-primary text-white flex items-center justify-center rounded-md transition-colors"
              data-testid="link-facebook"
            >
              <FaFacebookF className="w-4 h-4" />
            </a>
            <a 
              href="https://x.com/trendnovaworld" 
              target="_blank" 
              className="w-9 h-9 bg-slate-800 hover:bg-primary text-white flex items-center justify-center rounded-md transition-colors"
              data-testid="link-twitter"
            >
              <FaXTwitter className="w-4 h-4" />
            </a>
            <a 
              href="https://www.linkedin.com/company/trendnovaworld/" 
              target="_blank" 
              className="w-9 h-9 bg-slate-800 hover:bg-primary text-white flex items-center justify-center rounded-md transition-colors"
              data-testid="link-linkedin"
            >
              <FaLinkedinIn className="w-4 h-4" />
            </a>
            <a 
              href="https://www.instagram.com/trendnovaworld/#" 
              target="_blank" 
              className="w-9 h-9 bg-slate-800 hover:bg-primary text-white flex items-center justify-center rounded-md transition-colors"
              data-testid="link-instagram"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
          </div>
          <div className="text-xs text-slate-500 pt-2">
            &copy; {new Date().getFullYear()} Dev Global Jobs. All Rights Reserved.
          </div>
        </div>

        {/* Widget 2: Trend Nova World Group */}
        <div className="space-y-6">
          <div>
            <h6 className="text-white text-xs uppercase tracking-widest font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Trend Nova World Group
            </h6>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://trendnovaworld.com/" 
                  target="_blank" 
                  className="flex items-center justify-center md:justify-start gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" /> 
                  Trend Nova World (Main)
                </a>
              </li>
              <li>
                <a 
                  href="https://trendnovaworld.org/" 
                  target="_blank" 
                  className="flex items-center justify-center md:justify-start gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary" /> 
                  Trend Nova World Group
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="text-white text-xs uppercase tracking-widest font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Corporate Divisions
            </h6>
            <ul className="space-y-2 text-sm">
              <li><a href="https://hr.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Global HR Solutions</a></li>
              <li><a href="https://logistics.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Logistics & Supply Chain</a></li>
              <li><a href="https://realestate.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Real Estate Investment</a></li>
              <li><a href="https://fashion.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Fashion & Retail</a></li>
              <li><a href="https://education.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Education & Tech</a></li>
              <li><a href="https://development.trendnovaworld.com/" className="text-slate-400 hover:text-white transition-colors block">Development Sector</a></li>
            </ul>
          </div>
        </div>

        {/* Widget 3: Contact & Legal */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h6 className="text-white text-xs font-bold mb-3 uppercase flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4 text-primary" />
              For Job Publishing & Inquiries
            </h6>
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <a href="mailto:publication@devglobaljobs.com" className="text-slate-300 hover:text-white hover:underline">
                  publication@devglobaljobs.com
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                <FaWhatsapp className="w-3.5 h-3.5 text-primary" />
                <a href="https://wa.me/994518673521" target="_blank" className="text-slate-300 hover:text-white hover:underline">
                  +994 51 867 35 21 (Publications)
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <a href="mailto:info@devglobaljobs.com" className="text-slate-300 hover:text-white hover:underline">
                info@devglobaljobs.com
              </a>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <a href="tel:+447473863903" className="text-slate-300 hover:text-white hover:underline">
                +44 7473 863903 (UK Line)
              </a>
            </div>
          </div>

          <div>
            <h6 className="text-white text-xs font-bold mb-3 uppercase flex items-center justify-center md:justify-start gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Legal & Information
            </h6>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-about">
                  <Info className="w-3 h-3" /> About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-contact">
                  <Users className="w-3 h-3" /> Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-terms">
                  <FileText className="w-3 h-3" /> Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-privacy">
                  <Shield className="w-3 h-3" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-cookies">
                  <Cookie className="w-3 h-3" /> Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-2" data-testid="link-disclaimer">
                  <AlertCircle className="w-3 h-3" /> Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
