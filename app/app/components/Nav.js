"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, Zap, LogIn, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const links = [
    ["/events", "Events"],
    ["/store", "Store"],
    ["/sponsors", "Sponsors"],
    ["/about", "About"],
    ["/contact", "Contact"],
  ];

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b" style={{ borderColor: "#E7E2D9" }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-sm bg-ink">
            <Zap size={16} color="#FF5A1F" strokeWidth={3} />
          </div>
          <span className="font-black text-lg tracking-tight text-ink">
            APEX <span className="text-accent">ATHLETICS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm font-bold uppercase tracking-wide text-ink hover:text-accent">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/store" className="p-2"><ShoppingBag size={20} /></Link>
          <Link href={user ? "/dashboard" : "/login"} className={`btn ${user ? "btn-outline" : "btn-primary"}`}>
            {user ? <><LayoutDashboard size={15}/> Dashboard</> : <><LogIn size={15}/> Login</>}
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-5 py-4 flex flex-col gap-4" style={{ borderColor: "#E7E2D9" }}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="font-bold uppercase text-sm text-ink">{label}</Link>
          ))}
          <Link href="/store" onClick={() => setOpen(false)} className="font-bold uppercase text-sm flex items-center gap-2"><ShoppingBag size={16}/> Cart</Link>
          <Link href={user ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="btn btn-primary">{user ? "Dashboard" : "Login"}</Link>
        </div>
      )}
    </div>
  );
}
