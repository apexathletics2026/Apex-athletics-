import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const { data: e } = await supabase.from("events").select("name, description").eq("slug", params.slug).single();
  if (!e) return {};
  return { title: `${e.name} — Apex Athletics`, description: e.description };
}

export default async function EventDetailPage({ params }) {
  const supabase = createClient();
  const { data: e } = await supabase.from("events").select("*").eq("slug", params.slug).single();
  if (!e) notFound();

  const { count: registeredCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", e.id);

  const open = e.status === "Registration Open";
  const rules = (e.rules || "").split("\n").filter(Boolean);

  return (
    <div>
      <div className="relative h-80">
        {e.banner_url && <img src={e.banner_url} className="w-full h-full object-cover" alt={e.name} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(21,19,15,0.1), rgba(21,19,15,0.85))" }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-5 pb-8 text-white w-full">
          <Link href="/events" className="text-xs font-bold uppercase mb-3 opacity-70 block">← Back to events</Link>
          <h1 className="font-black text-3xl md:text-4xl">{e.name}</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[["Date", e.event_date], ["Time", e.start_time], ["Location", e.city], ["Distance", e.distance]].map(([k, v]) => (
              <div key={k} className="p-3 border rounded-sm" style={{ borderColor: "#E7E2D9" }}>
                <div className="text-[10px] uppercase font-bold text-muted">{k}</div>
                <div className="font-bold text-sm text-ink">{v}</div>
              </div>
            ))}
          </div>
          <h3 className="font-black text-lg mb-2 text-ink">About this event</h3>
          <p className="text-sm mb-6 leading-relaxed text-ink/80">{e.description}</p>
          {rules.length > 0 && (
            <>
              <h3 className="font-black text-lg mb-2 text-ink">Rules</h3>
              <ul className="text-sm mb-6 space-y-1.5 text-ink/80">
                {rules.map((r, i) => <li key={i} className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0" color="#FF5A1F"/>{r}</li>)}
              </ul>
            </>
          )}
          {e.prize_info && <><h3 className="font-black text-lg mb-2 text-ink">Prizes</h3><p className="text-sm leading-relaxed text-ink/80">{e.prize_info}</p></>}
        </div>
        <div>
          <div className="border rounded-sm p-6 sticky top-24" style={{ borderColor: "#E7E2D9" }}>
            <div className="font-black text-2xl mb-1 text-ink">₹{e.fee}</div>
            <div className="text-xs mb-4 text-muted">per participant</div>
            <div className="text-xs mb-5 text-muted">{registeredCount || 0} of {e.max_participants} slots filled</div>
            {open ? (
              <Link href={`/register/${e.slug}`} className="btn btn-primary !w-full">Register Now <ArrowRight size={15}/></Link>
            ) : (
              <button disabled className="btn !w-full" style={{ background: "#EEEEEC", color: "#6E685F" }}>{e.status}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
    }
