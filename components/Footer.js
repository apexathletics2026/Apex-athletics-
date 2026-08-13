import Link from "next/link";
import { Instagram, Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Footer() {
  const supabase = createClient();
  const { data } = await supabase.from("website_settings").select("value").eq("key", "footer_contact").maybeSingle();
  const c = data?.value || {};

  const waLink = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}` : null;

  return (
    <footer className="mt-20 bg-ink text-white/90">
      <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="font-black text-xl mb-3">APEX <span className="text-accent">ATHLETICS</span></div>
          <p className="text-sm opacity-70 leading-relaxed">Marathons, running, fitness and adventure events — built for every athlete, from first bib to finish line.</p>
          <div className="flex gap-3 mt-4">
            {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /></a>}
            {c.facebook && <a href={c.facebook} target="_blank" rel="noreferrer"><Facebook size={18} /></a>}
          </div>
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
            {c.phone && <span className="flex items-center gap-2"><Phone size={14}/> {c.phone}</span>}
            {c.email && <span className="flex items-center gap-2"><Mail size={14}/> {c.email}</span>}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Admin</div>
          <Link href="/admin" className="text-sm opacity-60">Admin Panel →</Link>
        </div>
      </div>
      <div className="text-center text-xs opacity-50 pb-6">© 2026 Apex Athletics. All rights reserved.</div>

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "#25D366" }}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={26} color="#fff" fill="#fff" />
        </a>
      )}
    </footer>
  );
    }
