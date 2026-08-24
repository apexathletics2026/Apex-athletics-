import { createClient } from "@/lib/supabase/server";
import FeedGrid from "@/components/FeedGrid";

export const revalidate = 15;
export const metadata = { title: "Feed — Apex Athletics" };

export default async function FeedPage() {
  const supabase = createClient();
  const { data: media } = await supabase
    .from("athlete_media")
    .select("*, certificates(certificate_number, full_name, event_name, category, finish_time, position)")
    .eq("status", "Approved")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-2">Community</div>
      <h1 className="font-black text-3xl mb-8 text-ink">Athlete Feed</h1>
      <FeedGrid items={media || []} />
    </div>
  );
            }
