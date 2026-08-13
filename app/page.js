import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Trophy, ShieldCheck, Award, Calendar, MapPin, Users } from "lucide-react";
import { Hero, RunningMarquee, CountUp, Reveal } from "@/components/HomeAnimations";

export const revalidate = 30;

export default async function Home() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("status", ["Registration Open", "Upcoming", "Registration Closed"])
    .order("event_date", { ascending: true })
    .limit(4);
  const { data: products } = await supabase.from("products").select("*").eq("featured", true).eq("status", "Active").limit(3);
  const { data: sponsors } = await supabase.from("sponsors").select("*").eq("active", true).order("sort_order");
  const { count: totalEvents } = await supabase.from("events").select("*", { count: "exact", head: true });
  const { count: totalRunners } = await supabase.from("event_registrations").select("*", { count: "exact", head: true });

  return (
    <div>
      <section className="relative h-[560px] flex items-end bg-ink overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600&q=80"
          alt="Marathon runner"
          className="absolute inset-0 w-full h-full object-cover opacity-60 hero-img-zoom"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(21,19,15,0.1) 0%, rgba(21,19,15,0.92) 90%)" }} />
        <Hero />
      </section>

      <RunningMarquee />

      <section className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-3 gap-4 border-b" style={{ borderColor: "#E7E2D9" }}>
        {[
          { value: totalEvents || 0, label: "Races Hosted" },
          { value: totalRunners || 0, label: "Runners Registered", suffix: "+" },
          { value: sponsors?.length || 0, label: "Sponsors" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-black text-3xl md:text-5xl text-ink tabular-nums">
              <CountUp value={s.value} suffix={s.suffix || ""} />
            </div>
            <div className="text-[11px] md:text-xs uppercase tracking-widest text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <Reveal>
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Upcoming</div>
          <h2 className="font-black text-2xl md:text-3xl mb-8 text-ink">Next up on the calendar</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          {(!events || events.length === 0) && <p className="text-sm text-muted">No upcoming events yet — check back soon.</p>}
          {events?.map((e, i) => (
            <Reveal key={e.id} className={i % 2 === 1 ? "md:!transition-delay-150" : ""}>
              <EventCard e={e} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ background: "#F2EFE9" }}>
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-8">
          {[
            { icon: <Trophy size={22} />, t: "Chip-Timed Races", d: "Certified accurate results for every category, every time." },
            { icon: <ShieldCheck size={22} />, t: "Safety First", d: "Medical support, hydration stations and marshals on every route." },
            { icon: <Award size={22} />, t: "Real Rewards", d: "Medals, certificates and cash prizes for category winners." },
          ].map((f, i) => (
            <Reveal key={i}>
              <div className="bg-white p-7 rounded-sm border card-hover" style={{ borderColor: "#E7E2D9" }}>
                <div className="w-11 h-11 rounded-sm flex items-center justify-center mb-4" style={{ background: "#FFF3EA", color: "#C43D0E" }}>
                  {f.icon}
                </div>
                <div className="font-black text-lg mb-1 text-ink">{f.t}</div>
                <p className="text-sm text-muted">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {products?.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-16">
          <Reveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Store</div>
                <h2 className="font-black text-2xl md:text-3xl text-ink">Gear up for race day</h2>
              </div>
              <Link href="/store" className="hidden md:flex items-center gap-1 text-sm font-bold text-accentDark">
                View all <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {products.map((p, i) => (
              <Reveal key={p.id}>
                <div className="border rounded-sm overflow-hidden bg-white card-hover" style={{ borderColor: "#E7E2D9" }}>
                  <div className="h-40 md:h-48 bg-gray-100" />
                  <div className="p-4">
                    <div className="font-bold text-sm mb-2 text-ink">{p.name}</div>
                    <div className="font-black text-ink">₹{p.discount_price || p.price}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {sponsors?.length > 0 && (
        <section className="py-16 bg-ink">
          <div className="max-w-6xl mx-auto px-5">
            <Reveal>
              <div className="text-xs font-bold tracking-[0.2em] uppercase mb-6 text-white/50">Our Sponsors</div>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                {sponsors.map((s) => (
                  <span key={s.id} className="text-white/80 font-bold text-lg tracking-tight">
                    {s.name}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}

function EventCard({ e }) {
  return (
    <Link href={`/events/${e.slug}`} className="group border rounded-sm overflow-hidden bg-white block card-hover" style={{ borderColor: "#E7E2D9" }}>
      <div className="relative h-52 overflow-hidden">
        {e.banner_url && (
          <img src={e.banner_url} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
      </div>
      <div className="p-5">
        <div className="text-xs font-bold uppercase tracking-wide mb-1 text-accentDark">{e.category}</div>
        <div className="font-black text-lg mb-2 text-ink">{e.name}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 text-muted">
          <span className="flex items-center gap-1"><Calendar size={13} /> {e.event_date}</span>
          <span className="flex items-center gap-1"><MapPin size={13} /> {e.city}</span>
          <span className="flex items-center gap-1"><Users size={13} /> {e.distance}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{e.status}</span>
          <span className="font-black text-sm text-ink">₹{e.fee}</span>
        </div>
      </div>
    </Link>
  );
    }
