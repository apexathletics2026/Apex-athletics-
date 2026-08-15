import { createClient } from "@/lib/supabase/server";

export const revalidate = 30;
export const metadata = { title: "Sponsors — Apex Athletics" };

export default async function SponsorsPage() {
  const supabase = createClient();
  const { data: sponsors } = await supabase.from("sponsors").select("*").eq("active", true).order("sort_order");
  const grouped = (sponsors || []).reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Partners</div>
      <h1 className="font-black text-3xl mb-10 text-ink">Our Sponsors</h1>
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest mb-4 text-accentDark">{cat}</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {list.map((s) => {
              const Card = (
                <div className="border rounded-sm p-6 flex flex-col items-center justify-center text-center gap-2 h-full" style={{ borderColor: "#E4DCC5" }}>
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="h-14 object-contain mb-2" />
                  ) : null}
                  <span className="font-black text-ink">{s.name}</span>
                </div>
              );
              return s.website ? (
                <a key={s.id} href={s.website} target="_blank" rel="noreferrer" className="hover:opacity-80">{Card}</a>
              ) : (
                <div key={s.id}>{Card}</div>
              );
            })}
          </div>
        </div>
      ))}
      {(!sponsors || sponsors.length === 0) && <p className="text-sm text-muted">No sponsors listed yet.</p>}
    </div>
  );
        }
