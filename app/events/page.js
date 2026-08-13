import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";

export const revalidate = 30;
export const metadata = { title: "Events — Apex Athletics" };

export default async function EventsPage({ searchParams }) {
  const supabase = createClient();
  let query = supabase.from("events").select("*").neq("status", "Draft").order("event_date", { ascending: true });
  if (searchParams?.category && searchParams.category !== "All") {
    query = query.eq("category", searchParams.category);
  }
  const { data: events } = await query;
  const cats = ["All", "Marathon", "Running", "Fitness", "Sports", "Adventure"];
  const active = searchParams?.category || "All";

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Calendar</div>
      <h1 className="font-black text-3xl mb-6 text-ink">All Events</h1>
      <div className="flex flex-wrap gap-2 mb-8">
        {cats.map((c) => (
          <Link
            key={c}
            href={c === "All" ? "/events" : `/events?category=${c}`}
            className="text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full border"
            style={{ borderColor: active === c ? "#FF5A1F" : "#E7E2D9", background: active === c ? "#FF5A1F" : "transparent", color: active === c ? "#fff" : "#15130F" }}
          >
            {c}
          </Link>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {events?.map((e) => (
          <Link key={e.id} href={`/events/${e.slug}`} className="border rounded-sm overflow-hidden bg-white block" style={{ borderColor: "#E7E2D9" }}>
            <div className="h-52">{e.banner_url && <img src={e.banner_url} className="w-full h-full object-cover" alt={e.name} />}</div>
            <div className="p-5">
              <div className="text-xs font-bold uppercase text-accentDark mb-1">{e.category}</div>
              <div className="font-black text-lg mb-2 text-ink">{e.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1"><Calendar size={13}/> {e.event_date}</span>
                <span className="flex items-center gap-1"><MapPin size={13}/> {e.city}</span>
                <span className="flex items-center gap-1"><Users size={13}/> {e.distance}</span>
              </div>
            </div>
          </Link>
        ))}
        {(!events || events.length === 0) && <p className="text-sm text-muted">No events in this category yet.</p>}
      </div>
    </div>
  );
}
