"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function genCode() {
  return "APX" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function redirectToPayU(action, params) {
  const formEl = document.createElement("form");
  formEl.method = "POST";
  formEl.action = action;
  Object.entries(params).forEach(([k, v]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    formEl.appendChild(input);
  });
  document.body.appendChild(formEl);
  formEl.submit();
}

export default function RegisterPage() {
  const { slug } = useParams();
  const supabase = createClient();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    full_name: "", mobile: "", address: "",
    category: "", tshirt_size: "",
    email: "", city: "", district: "", state: "", pincode: "",
    dob: "", gender: "", emergency_name: "", emergency_phone: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", slug).single();
      setEvent(data);
      setLoading(false);
    })();
  }, [slug]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (ev) => {
    ev.preventDefault();
    setErr("");
    if (!form.full_name || !form.mobile || !form.address) {
      setErr("Name, contact number and address are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const registration_code = genCode();
      const payload = {
        registration_code,
        event_id: event.id,
        user_id: user?.id || null,
        full_name: form.full_name,
        mobile: form.mobile,
        address: form.address,
        tshirt_size: form.tshirt_size || null,
        email: form.email || null,
        city: form.city || null,
        district: form.district || null,
        state: form.state || null,
        pincode: form.pincode || null,
        dob: form.dob || null,
        gender: form.gender || null,
        emergency_name: form.emergency_name || null,
        emergency_phone: form.emergency_phone || null,
        custom_fields: { category: form.category || null },
        status: "Pending Payment",
        terms_accepted: true,
      };

      const { data: reg, error } = await supabase
        .from("event_registrations")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setErr(error.message);
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: reg.id,
          amount: event.fee,
          name: form.full_name,
          email: form.email,
          phone: form.mobile,
        }),
      });
      const orderData = await res.json();

      if (!res.ok) {
        setErr(orderData.error || "Could not start payment. Please try again.");
        setSubmitting(false);
        return;
      }

      redirectToPayU(orderData.action, orderData.params);
    } catch (e) {
      setErr("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="px-5 py-20 text-center text-muted">Loading…</div>;
  if (!event) return <div className="px-5 py-20 text-center text-muted">Event not found.</div>;

  const categories = (event.race_categories || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="max-w-lg mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Registration</div>
      <h1 className="font-black text-2xl mb-1 text-ink">{event.name}</h1>
      <p className="text-sm text-muted mb-8">Just a few details — takes about 5 minutes.</p>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Full Name *" value={form.full_name} onChange={set("full_name")} />
        <Field label="Contact Number *" value={form.mobile} onChange={set("mobile")} />
        <TextArea label="Address *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

        {categories.length > 0 && (
          <div>
            <label className="field-label">Category</label>
            <select className="field-input" value={form.category} onChange={set("category")}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label">T-Shirt Size (optional)</label>
          <select className="field-input" value={form.tshirt_size} onChange={set("tshirt_size")}>
            <option value="">Select size</option>
            {["S", "M", "L", "XL", "XXL"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-bold text-accentDark">+ Add more details (optional)</summary>
          <div className="space-y-4 mt-4">
            <Field label="Email" value={form.email} onChange={set("email")} />
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field label="State" value={form.state} onChange={set("state")} />
            <Field label="Pincode" value={form.pincode} onChange={set("pincode")} />
            <Field label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
            <Field label="Gender" value={form.gender} onChange={set("gender")} />
            <Field label="Emergency Contact Name" value={form.emergency_name} onChange={set("emergency_name")} />
            <Field label="Emergency Contact Phone" value={form.emergency_phone} onChange={set("emergency_phone")} />
          </div>
        </details>

        {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}
        <button disabled={submitting} className="btn btn-primary !w-full" type="submit">
          {submitting ? "Redirecting to payment…" : `Pay ₹${event.fee} & Register`}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} className="field-input" value={value} onChange={onChange} />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea className="field-input" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
    }
