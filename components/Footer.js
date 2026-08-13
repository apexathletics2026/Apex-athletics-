import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white/90">
      <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="font-black text-xl mb-3">APEX <span className="text-accent">ATHLETICS</span></div>
          <p className="text-sm opacity-70 leading-relaxed">Marathons, running, fitness and adventure events — built for every athlete, from first bib to finish line.</p>
          <div className="flex gap-3 mt-4"><Instagram size={18} /><Facebook size={18} /><Twitter size={18} /></div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Explore</div>
          <div className="flex flex-col gap-2 text-sm opacity-80">
            <Link href="/events">Events</Link>
            <Link href="/store">Store</Link>
            <Link href="/sponsors">Sponsors</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Contact</div>
          <div className="flex flex-col gap-2 text-sm opacity-80">
            <span className="flex items-center gap-2"><Mail size={14}/> info@apexathletics.run</span>
            <span className="flex items-center gap-2"><Phone size={14}/> +91 00000 00000</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Admin</div>
          <Link href="/admin" className="text-sm opacity-60">Admin Panel →</Link>
        </div>
      </div>
      <div className="text-center text-xs opacity-50 pb-6">© 2026 Apex Athletics. All rights reserved.</div>
    </footer>
  );
    }
