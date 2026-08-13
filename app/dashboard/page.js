"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { router.push("/login"); return; }
      setUser(data.user);
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("*, events(name, event_date)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setRegs(registrations || []);
      setLoading(false);
    })();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-20 text-center text-muted">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark">My Account</div>
        <button onClick={logout} className="text-xs font-bold text-muted">Logout</button>
      </div>
      <h1 className="font-black text-2xl mb-1 text-ink">Hi, {user.user_metadata?.full_name || "Runner"}</h1>
      <p className="text-sm mb-8 text-muted">{user.email}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Registrations" value={regs.length} />
        <Stat label="Confirmed" value={regs.filter(r => r.status === "Confirmed").length} />
        <Stat label="Pending Payment" value={regs.filter(r => r.status === "Pending Payment" || r.status === "Payment Submitted").length} />
      </div>

      <h3 className="font-black text-lg mb-4 text-ink">My Registrations</h3>
      <div className="space-y-3">
        {regs.length === 0 && <p className="text-sm text-muted">No registrations yet — go register for an event!</p>}
        {regs.map((r) => (
          <div key={r.id} className="border rounded-sm p-4 flex items-center justify-between" style={{ borderColor: "#E7E2D9" }}>
            <div>
              <div className="font-bold text-sm">{r.events?.name}</div>
              <div className="text-xs text-muted">{r.registration_code}</div>
            </div>
            <span className="text-xs font-bold" style={{ color: r.status === "Confirmed" ? "#1B7A3B" : "#C43D0E" }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded-sm p-5" style={{ borderColor: "#E7E2D9" }}>
      <div className="text-2xl font-black text-ink">{value}</div>
      <div className="text-xs uppercase font-bold text-muted">{label}</div>
    </div>
  );
            }
