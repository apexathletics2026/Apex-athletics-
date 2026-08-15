"use client";
import { useState } from "react";
import { Search, User, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CheckRegistrationPage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    let code = query.trim().toUpperCase();
    if (!code.startsWith("APX")) code = `APX-${code}`;

    const { data } = await supabase
      .from("event_registrations")
      .select("*, events(name)")
      .eq("registration_code", code)
      .maybeSingle();

    setLoading(false);
    if (data) setResult(data);
    else setNotFound(true);
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Check Status</div>
      <h1 className="font-black text-3xl mb-2 text-ink">Registration Lookup</h1>
      <p className="text-sm text-muted mb-8">Enter your registration serial number to check your details and payment status.</p>

      <div className="flex gap-2 mb-8">
        <input
          className="field-input flex-1"
          placeholder="e.g. 220 or APX-220"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="btn btn-primary" onClick={search} disabled={loading}>
          <Search size={16}/> {loading ? "…" : "Search"}
        </button>
      </div>

      {notFound && (
        <div className="border rounded-sm p-6 text-center text-sm text-muted" style={{ borderColor: "#E4DCC5" }}>
          No registration found for "{query}". Check the number and try again.
        </div>
      )}

      {result && (
        <div className="border rounded-sm p-6 bg-white" style={{ borderColor: "#E4DCC5" }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={20} color="#E8A93B" />
            <div className="font-black text-lg text-ink">{result.full_name}</div>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Serial Number" value={result.registration_code} />
            <Row label="Event" value={result.events?.name} />
            {result.address && <Row label="Address" value={result.address} />}
            {result.mobile && <Row label="Mobile" value={result.mobile} />}
          </div>
          <div className="mt-5 pt-5 border-t flex items-center gap-2" style={{ borderColor: "#E4DCC5" }}>
            {result.status === "Confirmed" ? (
              <><CheckCircle2 size={18} color="#1B7A3B" /><span className="font-bold text-sm" style={{ color: "#1B7A3B" }}>Paid</span></>
            ) : (
              <><XCircle size={18} color="#B3271E" /><span className="font-bold text-sm" style={{ color: "#B3271E" }}>Unpaid</span></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right text-ink">{value || "—"}</span>
    </div>
  );
      }
