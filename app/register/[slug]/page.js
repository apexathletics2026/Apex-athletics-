"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Copy, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [upi, setUpi] = useState({ upi_id: "", qr_image_url: "" });
  const [step, setStep] = useState(1);
  const [regCode, setRegCode] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
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
      const { data: s } = await supabase.from("website_settings").select("value").eq("key", "upi_payment").maybeSingle();
      if (s?.value) setUpi(s.value);
    })();
  }, [params.slug]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const copyUpi = async () => {
    try { await navigator.clipboard.writeText(upi.upi_id); } catch {}
  };

  const submit = async () => {
    setErr("");
    if (!screenshot) { setErr("Please upload a screenshot of your payment before submitting."); return; }
    setUploading(true);

    const code = `APX-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const fileExt = screenshot.name.split(".").pop();
    const filePath = `${code}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(filePath, screenshot);
    if (uploadError) {
      setErr("Screenshot upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);

    const { error } = await supabase.from("event_registrations").insert({
      registration_code: code,
      event_id: event.id,
      user_id: user?.id || null,
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
      payment_method: "UPI",
      payment_screenshot_url: pub.publicUrl,
      status: "Payment Submitted",
    });

    setUploading(false);
    if (error) { setErr("Something went wrong saving your registration: " + error.message); return; }
    setRegCode(code);
    setStep(4);
  };

  if (!event) return <div className="max-w-lg mx-auto px-5 py-20 text-center text-muted">Loading event…</div>;

  if (step === 4) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <CheckCircle2 size={48} color="#FF5A1F" className="mx-auto mb-4" />
        <h1 className="font-black text-2xl mb-2 text-ink">Registration Submitted</h1>
        <p className="text-sm mb-6 text-muted">You're on the list for {event.name}. Our team will verify your payment screenshot and confirm your spot shortly.</p>
        <div className="border rounded-sm p-6 text-left text-sm space-y-2 mb-6" style={{ borderColor: "#E7E2D9" }}>
          <div className="flex justify-between"><span className="text-muted">Registration ID</span><span className="font-black">{regCode}</span></div>
          <div className="flex justify-between"><span className="text-muted">Participant</span><span className="font-bold">{form.fullName}</span></div>
          <div className="flex justify-between"><span className="text-muted">Event</span><span className="font-bold">{event.name}</span></div>
          <div className="flex justify-between"><span className="text-muted">Payment</span><span className="font-bold" style={{ color: "#C43D0E" }}>Submitted — awaiting verification</span></div>
        </div>
        <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary !w-full">Continue <ArrowRight size={15}/></Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-14">
      <Link href={`/events/${event.slug}`} className="text-xs font-bold uppercase mb-4 block text-muted">← Back</Link>
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Register</div>
      <h1 className="font-black text-2xl mb-1 text-ink">{event.name}</h1>
      <p className="text-sm mb-8 text-muted">Fee: ₹{event.fee} · Step {step} of 3</p>

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
          <button
            className="btn btn-primary !w-full mt-2 disabled:opacity-40"
            disabled={!form.declaration || !form.terms || !form.fullName || !form.mobile}
            onClick={() => setStep(3)}
          >
            Continue to Payment <ArrowRight size={15}/>
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="border rounded-sm p-5 text-center" style={{ borderColor: "#E7E2D9" }}>
            <div className="font-black text-xl mb-1 text-ink">Pay ₹{event.fee}</div>
            <div className="text-xs text-muted mb-4">Scan the QR code or pay to the UPI ID below</div>
            {upi.qr_image_url ? (
              <img src={upi.qr_image_url} alt="UPI QR Code" className="w-48 h-48 mx-auto mb-4 border" style={{ borderColor: "#E7E2D9" }} />
            ) : (
              <div className="w-48 h-48 mx-auto mb-4 border flex items-center justify-center text-xs text-muted" style={{ borderColor: "#E7E2D9" }}>
                QR code not added yet — pay using the UPI ID below
              </div>
            )}
            {upi.upi_id ? (
              <button onClick={copyUpi} className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 border rounded-sm" style={{ borderColor: "#E7E2D9" }}>
                {upi.upi_id} <Copy size={14}/>
              </button>
            ) : (
              <p className="text-xs text-muted">UPI ID not added yet — set it in the Admin Panel under Settings.</p>
            )}
          </div>

          <div>
            <label className="field-label">Upload Payment Screenshot</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
              <Upload size={16}/> {screenshot ? screenshot.name : "Tap to choose screenshot"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
            </label>
          </div>

          {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}

          <button disabled={uploading} className="btn btn-primary !w-full disabled:opacity-50" onClick={submit}>
            {uploading ? "Submitting…" : "Submit Registration"} <ArrowRight size={15}/>
          </button>
          <p className="text-[11px] text-center text-muted">Your spot is confirmed once our team verifies the payment screenshot — usually within a few hours.</p>
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
