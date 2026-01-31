
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaWhatsapp, FaGlobe, FaSitemap, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="site-footer bg-[#0f172a] text-[#94a3b8] py-12 px-4 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {/* Widget 1: About */}
        <div className="tnw-widget-container p-2">
          <h3 className="tnw-logo text-white text-2xl font-bold mb-1 uppercase">Dev Global Jobs</h3>
          <span className="tnw-subtitle text-[#38bdf8] text-xs font-semibold block mb-4 italic">
            Associated with Trend Nova World Ltd.
          </span>
          <p className="tnw-desc text-sm leading-relaxed mb-6">
            Dev Global Jobs is an online opportunities platform associated with Trend Nova World Limited. We publish development sector jobs, consultancy roles, and professional opportunities worldwide, supporting organizations in humanitarian, sustainability, and education sectors.
          </p>
          <div className="tnw-socials flex justify-center gap-3 my-5">
            <a href="https://www.facebook.com/trendnovaworld" target="_blank" className="w-9 h-9 bg-[#1e293b] text-white flex items-center justify-center rounded transition-colors hover:bg-[#0072c6]">
              <FaFacebookF />
            </a>
            <a href="https://x.com/trendnovaworld" target="_blank" className="w-9 h-9 bg-[#1e293b] text-white flex items-center justify-center rounded transition-colors hover:bg-[#0072c6]">
              <FaXTwitter />
            </a>
            <a href="https://www.linkedin.com/company/trendnovaworld/" target="_blank" className="w-9 h-9 bg-[#1e293b] text-white flex items-center justify-center rounded transition-colors hover:bg-[#0072c6]">
              <FaLinkedinIn />
            </a>
            <a href="https://www.instagram.com/trendnovaworld/#" target="_blank" className="w-9 h-9 bg-[#1e293b] text-white flex items-center justify-center rounded transition-colors hover:bg-[#0072c6]">
              <FaInstagram />
            </a>
          </div>
          <div className="tnw-copyright text-[11px] color-[#64748b]">
            &copy; 2026 Dev Global Jobs. All Rights Reserved.
          </div>
        </div>

        {/* Widget 2: Trend Nova World Group */}
        <div className="tnw-widget-container p-2">
          <h6 className="tnw-heading text-white text-xs uppercase tracking-widest font-bold mb-4">Trend Nova World Group</h6>
          <ul className="tnw-links space-y-2 mb-6">
            <li>
              <a href="https://trendnovaworld.com/" target="_blank" className="flex items-center justify-center gap-2 text-[#94a3b8] hover:text-white hover:pl-1 transition-all">
                <FaGlobe className="text-[#38bdf8] w-4 text-center" /> Trend Nova World (Main)
              </a>
            </li>
            <li>
              <a href="https://trendnovaworld.org/" target="_blank" className="flex items-center justify-center gap-2 text-[#94a3b8] hover:text-white hover:pl-1 transition-all">
                <FaSitemap className="text-[#38bdf8] w-4 text-center" /> Trend Nova World Group
              </a>
            </li>
          </ul>

          <h6 className="tnw-heading text-white text-xs uppercase tracking-widest font-bold mb-4">Corporate Divisions</h6>
          <ul className="tnw-links space-y-2">
            <li><a href="https://hr.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Global HR Solutions</a></li>
            <li><a href="https://logistics.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Logistics & Supply Chain</a></li>
            <li><a href="https://realestate.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Real Estate Investment</a></li>
            <li><a href="https://fashion.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Fashion & Retail</a></li>
            <li><a href="https://education.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Education & Tech</a></li>
            <li><a href="https://development.trendnovaworld.com/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Development Sector</a></li>
          </ul>
        </div>

        {/* Widget 3: Contact & Legal */}
        <div className="tnw-widget-container p-2">
          <div className="tnw-highlight-box bg-[#1e293b] p-4 rounded-md border border-[#334155] mb-4">
            <h6 className="tnw-heading-small text-white text-[11px] font-bold mb-2 uppercase">For Job Publishing & Inquiries</h6>
            <div className="tnw-contact-row flex items-center justify-center gap-2 mb-2">
              <FaEnvelope className="text-[#38bdf8] w-4 text-center" />
              <a href="mailto:publication@devglobaljobs.com" className="text-[#e2e8f0] hover:underline hover:text-white">publication@devglobaljobs.com</a>
            </div>
            <div className="tnw-contact-row flex items-center justify-center gap-2">
              <FaWhatsapp className="text-[#38bdf8] w-4 text-center" />
              <a href="https://wa.me/994518673521" target="_blank" className="text-[#e2e8f0] hover:underline hover:text-white">+994 51 867 35 21 (Publications)</a>
            </div>
          </div>

          <div className="tnw-general-contact mb-6">
            <div className="tnw-contact-row flex items-center justify-center gap-2 mb-2">
              <FaEnvelope className="text-[#38bdf8] w-4 text-center" />
              <a href="mailto:info@devglobaljobs.com" className="text-[#e2e8f0] hover:underline hover:text-white">info@devglobaljobs.com</a>
            </div>
            <div className="tnw-contact-row flex items-center justify-center gap-2">
              <FaPhoneAlt className="text-[#38bdf8] w-4 text-center" />
              <a href="tel:+447473863903" className="text-[#e2e8f0] hover:underline hover:text-white">+44 7473 863903 (UK Line)</a>
            </div>
          </div>

          <div className="tnw-legal mt-5">
            <h6 className="tnw-heading-small text-white text-[11px] font-bold mb-2 uppercase">Legal & Information</h6>
            <ul className="tnw-links space-y-2">
              <li><a href="https://devglobaljobs.com/about-us/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">About Us</a></li>
              <li><a href="https://devglobaljobs.com/contact-us/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Contact Us</a></li>
              <li><a href="https://devglobaljobs.com/terms-and-conditions/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Terms and Conditions</a></li>
              <li><a href="https://devglobaljobs.com/privacy-policy/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Privacy Policy</a></li>
              <li><a href="https://devglobaljobs.com/cookie-policy/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Cookie Policy</a></li>
              <li><a href="https://devglobaljobs.com/disclaimer/" className="text-[#94a3b8] hover:text-white hover:pl-1 transition-all block text-center">Disclaimer</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
