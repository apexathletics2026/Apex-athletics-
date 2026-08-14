"use client";
import { useState, useEffect } from "react";
import { Search, Award, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CertificatePage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [founder, setFounder] = useState({ name: "", signature_url: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("website_settings").select("value").eq("key", "founder").maybeSingle();
      if (data?.value) setFounder(data.value);
    })();
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .or(`certificate_number.eq.${query.trim()},bib_number.eq.${query.trim()}`)
      .maybeSingle();
    setLoading(false);
    if (data) setResult(data);
    else setNotFound(true);
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Verify</div>
      <h1 className="font-black text-3xl mb-2 text-ink">Certificate Lookup</h1>
      <p className="text-sm text-muted mb-8">Enter your certificate number or bib number to view and verify your finisher certificate.</p>

      <div className="flex gap-2 mb-8">
        <input
          className="field-input flex-1"
          placeholder="e.g. CERT-1234 or bib number"
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
          No certificate found for "{query}". Check the number and try again.
        </div>
      )}

      {result && (
        <div className="border-4 rounded-sm p-8 text-center bg-white" style={{ borderColor: "#15130F" }}>
          <Award size={36} color="#E8A93B" className="mx-auto mb-3" />
          <div className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Certificate of Achievement</div>
          <h2 className="font-black text-2xl mb-4 text-ink">{result.full_name}</h2>
          <p className="text-sm text-muted mb-6">has successfully completed</p>
          <div className="font-black text-lg mb-6 text-ink">{result.event_name}</div>

          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            {result.bib_number && <Detail label="Bib Number" value={result.bib_number} />}
            {result.category && <Detail label="Category" value={result.category} />}
            {result.finish_time && <Detail label="Finish Time" value={result.finish_time} />}
            {result.position && <Detail label="Position" value={result.position} />}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted mb-4">
            <CheckCircle2 size={14} color="#1B7A3B" /> Certificate No. {result.certificate_number}
          </div>

          {founder.signature_url && (
            <div className="pt-6 border-t mt-6" style={{ borderColor: "#E4DCC5" }}>
              <img src={founder.signature_url} alt="Signature" className="h-12 mx-auto mb-1 object-contain" />
              <div className="text-xs font-bold text-ink">{founder.name}</div>
              <div className="text-[10px] text-muted uppercase tracking-wide">Founder, Apex Athletics</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="border rounded-sm p-3" style={{ borderColor: "#E4DCC5" }}>
      <div className="text-[10px] uppercase font-bold text-muted">{label}</div>
      <div className="font-bold text-sm text-ink">{value}</div>
    </div>
  );
        }
