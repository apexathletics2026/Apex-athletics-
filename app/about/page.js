import { createClient } from "@/lib/supabase/server";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

export const revalidate = 30;
export const metadata = { title: "About — Apex Athletics" };

export default async function About() {
  const supabase = createClient();
  const { data: team } = await supabase.from("team_members").select("*").order("sort_order");

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Who we are</div>
      <h1 className="font-black text-3xl mb-6 text-ink">About Apex Athletics</h1>
      <p className="text-sm leading-relaxed mb-4 text-ink/80">Apex Athletics organizes marathons, running, fitness and adventure events for athletes of every level. We believe every finish line should feel earned — from the first bib pinned on to the last medal handed out.</p>
      <p className="text-sm leading-relaxed text-ink/80">Our team handles everything from chip timing to on-course medical support, so runners can focus on one thing: the race ahead.</p>

      {team && team.length > 0 && (
        <div className="mt-14">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-6">Our Team</div>
          <div className="grid sm:grid-cols-2 gap-6">
            {team.map((m) => (
              <div key={m.id} className="border rounded-sm p-6 text-center" style={{ borderColor: "#E4DCC5" }}>
                {m.photo_url && <img src={m.photo_url} alt={m.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />}
                <div className="font-black text-lg text-ink">{m.name}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-accentDark mb-3">{m.role}</div>
                {m.bio && <p className="text-sm text-muted mb-4">{m.bio}</p>}
                <div className="flex items-center justify-center gap-3">
                  {m.instagram && <a href={m.instagram} target="_blank" rel="noreferrer"><Instagram size={18} className="text-ink"/></a>}
                  {m.facebook && <a href={m.facebook} target="_blank" rel="noreferrer"><Facebook size={18} className="text-ink"/></a>}
                  {m.twitter && <a href={m.twitter} target="_blank" rel="noreferrer"><Twitter size={18} className="text-ink"/></a>}
                  {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} className="text-ink"/></a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
    }
