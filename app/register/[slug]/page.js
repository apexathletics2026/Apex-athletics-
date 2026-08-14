"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage({ params }) {
  const supabase = createClient();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [regCode, setRegCode] = useState("");
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState(false);
  const formRef = useRef(null);
  const [payuParams, setPayuParams] = useState(null);
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "Male", mobile: "", email: "",
    city: "", state: "", tshirt: "M", emergencyName: "", emergencyPhone: "",
    declaration: false, terms: false,
  });

  useEffect(() => {
    (async () => {
      const { data: e } = await supabase.from("events").select("*").eq("slug", params.slug).single();
      setEvent(e);
      const { data: u } = await supabase.auth.getUser();
      setUser(u?.user || null);
      if (u?.user?.email) setForm((f) => ({ ...f, email: u.user.email }));
    })();
  }, [params.slug]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createRegistrationAndPay = async () => {
    setErr("");
    setPaying(true);
    const code = `${String(Math.floor(1000 + Math.random() * 9000))}`;

    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("event_registrations").insert({
      registration_code: `APX-2026-${code}`,
      event_id: event.id,
      user_id: u?.user?.id || null,
      full_name: form.fullName,
      dob: form.dob || null,
      gender: form.gender,
      mobile: form.mobile,
      email: form.email,
      city: form.city,
      state: form.state,
      tshirt_size: form.tshirt,
      emergency_name: form.emergencyName,
      emergency_phone: form.emergencyPhone,
      medical_declaration: form.declaration,
      terms_accepted: form.terms,
      payment_method: "PayU",
      status: "Pending Payment",
    });

    if (error) { setErr("Something went wrong: " + error.message); setPaying(false); return; }

    fetch("/api/notify-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: form.fullName, eventName: event.name, mobile: form.mobile, registrationCode: `APX-2026-${code}` }),
    }).catch(() => {});

    setRegCode(`APX-2026-${code}`);

    const res = await fetch("/api/payu/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: event.fee,
        productinfo: event.name,
        firstname: form.fullName,
        email: form.email,
        phone: form.mobile,
        txnid: `REG-${code}`,
        surl: `${window.location.origin}/api/payu/verify`,
        furl: `${window.location.origin}/api/payu/verify`,
      }),
    });
    const { action, params: p } = await res.json();
    setPayuParams({ action, params: p });
    setPaying(false);
  };

  useEffect(() => {
    if (payuParams && formRef.current) formRef.current.submit();
  }, [payuParams]);

  if (!event) return <div className="max-w-lg mx-auto px-5 py-20 text-center text-muted">Loading event…</div>;

  return (
    <div className="max-w-lg mx-auto px-5 py-14">
      <Link href={`/events/${event.slug}`} className="text-xs font-bold uppercase mb-4 block text-muted">← Back</Link>
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Register</div>
      <h1 className="font-black text-2xl mb-1 text-ink">{event.name}</h1>
      <p className="text-sm mb-8 text-muted">Fee: ₹{event.fee} · Step {step} of 2</p>

      {step === 1 && (
        <div className="space-y-4">
          <F label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} />
          <div className="grid grid-cols-2 gap-4">
            <F label="Date of Birth" type="date" value={form.dob} onChange={(v) => set("dob", v)} />
            <Sel label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={["Male", "Female", "Other"]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Mobile Number" value={form.mobile} onChange={(v) => set("mobile", v)} />
            <F label="Email" value={form.email} onChange={(v) => set("email", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="City" value={form.city} onChange={(v) => set("city", v)} />
            <F label="State" value={form.state} onChange={(v) => set("state", v)} />
          </div>
          <Sel label="T-Shirt Size" value={form.tshirt} onChange={(v) => set("tshirt", v)} options={["S", "M", "L", "XL", "XXL"]} />
          <button className="btn btn-primary !w-full mt-2" onClick={() => setStep(2)}>Continue <ArrowRight size={15}/></button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <F label="Emergency Contact Name" value={form.emergencyName} onChange={(v) => set("emergencyName", v)} />
          <F label="Emergency Contact Number" value={form.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} />
          <label className="flex items-start gap-2 text-xs text-ink/80">
            <input type="checkbox" checked={form.declaration} onChange={(e) => set("declaration", e.target.checked)} className="mt-0.5" />
            I confirm I am medically fit to participate in this event.
          </label>
          <label className="flex items-start gap-2 text-xs text-ink/80">
            <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5" />
            I accept the event terms & conditions and rules.
          </label>
          {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}
          <button
            className="btn btn-primary !w-full mt-2 disabled:opacity-40"
            disabled={!form.declaration || !form.terms || !form.fullName || !form.mobile || paying}
            onClick={createRegistrationAndPay}
          >
            {paying ? "Redirecting to Payment…" : `Pay ₹${event.fee} with PayU`} <ArrowRight size={15}/>
          </button>

          {payuParams && (
            <form ref={formRef} action={payuParams.action} method="post" className="hidden">
              {Object.entries(payuParams.params).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field-input" />
    </div>
  );
}
function Sel({ label, value, onChange, options }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field-input">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
  }
