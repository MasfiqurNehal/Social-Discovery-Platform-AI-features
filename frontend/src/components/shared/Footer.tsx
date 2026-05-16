"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Mail, 
  MapPin, 
  ChevronRight, 
  Globe
} from "lucide-react";

// Custom SVG Brand Icons since Lucide removed them in latest versions
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  const footerLinks = {
    platform: [
      { label: "Discover Places", href: "/places" },
      { label: "Trending Events", href: "/events" },
      { label: "City Guides", href: "/blog" },
      { label: "Community Feed", href: "/activity" },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Contact Us", href: "/contact" },
    ],
    social: [
      { icon: <FacebookIcon className="h-5 w-5" />, href: "#", label: "Facebook" },
      { icon: <InstagramIcon className="h-5 w-5" />, href: "#", label: "Instagram" },
      { icon: <TwitterIcon className="h-5 w-5" />, href: "#", label: "Twitter" },
      { icon: <GithubIcon className="h-5 w-5" />, href: "#", label: "Github" },
    ]
  };

  return (
    <footer className="relative bg-[var(--bg-card)] border-t border-[var(--border)] pt-20 pb-10 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[100px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                Vibe<span className="text-brand-500">Spot</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-[var(--text-muted)] leading-relaxed max-w-sm">
              Dhaka's premier community-driven platform for discovering the best vibes, hidden gems, and unforgettable events across the city.
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.social.map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 rounded-xl bg-[var(--bg-default)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-brand-500 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all shadow-sm"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Platform</h4>
            <ul className="space-y-4">
              {footerLinks.platform.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm font-bold text-[var(--text-muted)] hover:text-brand-500 flex items-center gap-1 transition-colors group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm font-bold text-[var(--text-muted)] hover:text-brand-500 flex items-center gap-1 transition-colors group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--bg-default)] border border-[var(--border)] shadow-sm">
              <h4 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-500" /> Stay in the Loop
              </h4>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 leading-relaxed">
                Get weekly updates on new spots and exclusive events.
              </p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none transition-all pr-12"
                />
                <button className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-500 text-white rounded-xl flex items-center justify-center hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> English (US)</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Dhaka, BD</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
            © 2026 VibeSpot Platform. Crafted with ❤️ for Dhaka.
          </p>
        </div>
      </div>
    </footer>
  );
}
