"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Plus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("overview");
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [upi, setUpi] = useState({ upi_id: "", qr_image_url: "" });
  const [qrFile, setQrFile] = useState(null);
  const [savingUpi, setSavingUpi] = useState(false);
  const [footer, setFooter] = useState({ phone: "", email: "", instagram: "", facebook: "", whatsapp: "" });
  const [savingFooter, setSavingFooter] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { router.push("/login"); return; }
      const { data: adminRow } = await supabase.from("admins").select("id").eq("id", u.user.id).maybeSingle();
      if (!adminRow) { setChecking(false); setIsAdmin(false); return; }
      setIsAdmin(true);
      setChecking(false);
      await loadAll();
    })();
  }, []);

  const loadAll = async () => {
    const [{ data: ev }, { data: pr }, { data: sp }, { data: rg }] = await Promise.all([
      supabase.from("events").select("*").order("event_date"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("sponsors").select("*").order("sort_order"),
      supabase.from("event_registrations").select("*, events(name)").order("created_at", { ascending: false }),
    ]);
    setEvents(ev || []); setProducts(pr || []); setSponsors(sp || []); setRegistrations(rg || []);
    const { data: s } = await supabase.from("website_settings").select("value").eq("key", "upi_payment").maybeSingle();
    if (s?.value) setUpi(s.value);
    const { data: f } = await supabase.from("website_settings").select("value").eq("key", "footer_contact").maybeSingle();
    if (f?.value) setFooter(f.value);
  };

  const saveFooter = async (patch) => {
    setSavingFooter(true);
    const next = { ...footer, ...patch };
    await supabase.from("website_settings").upsert({ key: "footer_contact", value: next });
    setFooter(next);
    setSavingFooter(false);
  };

  const saveUpi = async (patch) => {
    setSavingUpi(true);
    const next = { ...upi, ...patch };
    await supabase.from("website_settings").upsert({ key: "upi_payment", value: next });
    setUpi(next);
    setSavingUpi(false);
  };

  const uploadQr = async () => {
    if (!qrFile) return;
    setSavingUpi(true);
    const path = `qr-${Date.now()}.${qrFile.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, qrFile);
    if (!error) {
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      await saveUpi({ qr_image_url: pub.publicUrl });
    }
    setQrFile(null);
    setSavingUpi(false);
  };

  const approveRegistration = async (id) => { await supabase.from("event_registrations").update({ status: "Confirmed" }).eq("id", id); loadAll(); };
  const rejectRegistration = async (id) => { await supabase.from("event_registrations").update({ status: "Pending Payment" }).eq("id", id); loadAll(); };

  const addEvent = async () => {
    const slug = `event-${Date.now()}`;
    await supabase.from("events").insert({ slug, name: "New Event", category: "Running", event_date: "2026-12-01", fee: 500, max_participants: 500, status: "Draft" });
    loadAll();
  };
  const updateEvent = async (id, patch) => { await supabase.from("events").update(patch).eq("id", id); loadAll(); };
  const deleteEvent = async (id) => { await supabase.from("events").delete().eq("id", id); loadAll(); };

  const addProduct = async () => {
    const slug = `product-${Date.now()}`;
    await supabase.from("products").insert({ slug, name: "New Product", price: 999, status: "Draft" });
    loadAll();
  };
  const updateProduct = async (id, patch) => { await supabase.from("products").update(patch).eq("id", id); loadAll(); };
  const deleteProduct = async (id) => { await supabase.from("products").delete().eq("id", id); loadAll(); };

  const addSponsor = async () => { await supabase.from("sponsors").insert({ name: "New Sponsor", category: "Partner" }); loadAll(); };
  const updateSponsor = async (id, patch) => { await supabase.from("sponsors").update(patch).eq("id", id); loadAll(); };
  const deleteSponsor = async (id) => { await supabase.from("sponsors").delete().eq("id", id); loadAll(); };

  if (checking) return <div className="max-w-6xl mx-auto px-5 py-20 text-center text-muted">Checking access…</div>;

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto px-5 py-20 text-center">
        <ShieldCheck size={28} color="#FF5A1F" className="mx-auto mb-4" />
        <h1 className="font-black text-xl mb-2 text-ink">Not Authorized</h1>
        <p className="text-sm text-muted">This account isn't in the admins list. See MANUAL_SETUP.md for how to add yourself as admin.</p>
      </div>
    );
  }

  const tabs = ["overview", "events", "products", "sponsors", "registrations", "payment settings", "site settings"];
  const stats = [
    ["Total Events", events.length],
    ["Registrations", registrations.length],
    ["Products", products.length],
    ["Sponsors", sponsors.length],
    ["Open Events", events.filter(e => e.status === "Registration Open").length],
    ["Pending Payments", registrations.filter(r => r.status === "Pending Payment").length],
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex items-center gap-2 mb-8"><ShieldCheck size={20} color="#FF5A1F"/><h1 className="font-black text-2xl text-ink">Admin Panel</h1></div>
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full border whitespace-nowrap"
            style={{ borderColor: tab === t ? "#FF5A1F" : "#E7E2D9", background: tab === t ? "#FF5A1F" : "transparent", color: tab === t ? "#fff" : "#15130F" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map(([label, value]) => (
            <div key={label} className="border rounded-sm p-5" style={{ borderColor: "#E7E2D9" }}>
              <div className="text-2xl font-black text-ink">{value}</div>
              <div className="text-xs uppercase font-bold text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addEvent}><Plus size={15}/> Add Event</button>
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <TF label="Name" value={e.name} onBlur={(v) => updateEvent(e.id, { name: v })} />
                  <SF label="Status" value={e.status} onChange={(v) => updateEvent(e.id, { status: v })} options={["Draft", "Registration Open", "Registration Closed", "Upcoming", "Completed", "Cancelled"]} />
                  <TF label="Date" type="date" value={e.event_date} onBlur={(v) => updateEvent(e.id, { event_date: v })} />
                  <TF label="Fee (₹)" type="number" value={e.fee} onBlur={(v) => updateEvent(e.id, { fee: Number(v) })} />
                </div>
                <button onClick={() => deleteEvent(e.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addProduct}><Plus size={15}/> Add Product</button>
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <TF label="Name" value={p.name} onBlur={(v) => updateProduct(p.id, { name: v })} />
                  <TF label="Price (₹)" type="number" value={p.price} onBlur={(v) => updateProduct(p.id, { price: Number(v) })} />
                  <SF label="Status" value={p.status} onChange={(v) => updateProduct(p.id, { status: v })} options={["Draft", "Active", "Out of Stock", "Archived"]} />
                  <label className="flex items-center gap-2 text-xs font-bold mt-6 text-ink">
                    <input type="checkbox" checked={p.featured} onChange={(e) => updateProduct(p.id, { featured: e.target.checked })} /> Featured
                  </label>
                </div>
                <button onClick={() => deleteProduct(p.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "sponsors" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addSponsor}><Plus size={15}/> Add Sponsor</button>
          <div className="space-y-3">
            {sponsors.map((s) => (
              <div key={s.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <TF label="Name" value={s.name} onBlur={(v) => updateSponsor(s.id, { name: v })} />
                  <SF label="Category" value={s.category} onChange={(v) => updateSponsor(s.id, { category: v })} options={["Title Sponsor", "Gold Sponsor", "Silver Sponsor", "Partner", "Supporting Partner", "Media Partner"]} />
                </div>
                <button onClick={() => deleteSponsor(s.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "registrations" && (
        <div className="space-y-3">
          {registrations.map((r) => (
            <div key={r.id} className="border rounded-sm p-4 flex flex-wrap items-center gap-4 justify-between" style={{ borderColor: "#E7E2D9" }}>
              <div>
                <div className="font-black text-sm">{r.registration_code} — {r.full_name}</div>
                <div className="text-xs text-muted">{r.events?.name} · {r.mobile}</div>
                <div className="text-xs font-bold mt-1" style={{ color: r.status === "Confirmed" ? "#1B7A3B" : "#C43D0E" }}>{r.status}</div>
              </div>
              <div className="flex items-center gap-3">
                {r.payment_screenshot_url && (
                  <a href={r.payment_screenshot_url} target="_blank" rel="noreferrer">
                    <img src={r.payment_screenshot_url} alt="Payment proof" className="w-14 h-14 object-cover border rounded-sm" style={{ borderColor: "#E7E2D9" }} />
                  </a>
                )}
                {r.status !== "Confirmed" && (
                  <button onClick={() => approveRegistration(r.id)} className="btn btn-primary !py-2 !px-4 !text-xs">Mark Paid</button>
                )}
                {r.status === "Confirmed" && (
                  <button onClick={() => rejectRegistration(r.id)} className="btn btn-outline !py-2 !px-4 !text-xs">Undo</button>
                )}
              </div>
            </div>
          ))}
          {registrations.length === 0 && <p className="text-sm text-muted">No registrations yet.</p>}
        </div>
      )}

      {tab === "payment settings" && (
        <div className="max-w-md">
          <p className="text-sm text-muted mb-6">This UPI ID and QR code show up on the registration payment step until Razorpay is connected.</p>
          <div className="mb-5">
            <label className="field-label">UPI ID</label>
            <div className="flex gap-2">
              <input className="field-input" defaultValue={upi.upi_id} onBlur={(e) => saveUpi({ upi_id: e.target.value })} placeholder="yourname@upi" />
            </div>
          </div>
          <div className="mb-5">
            <label className="field-label">QR Code Image</label>
            {upi.qr_image_url && <img src={upi.qr_image_url} alt="Current QR" className="w-32 h-32 border mb-3" style={{ borderColor: "#E7E2D9" }} />}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
              <Upload size={16}/> {qrFile ? qrFile.name : "Tap to choose a QR code image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
            </label>
            {qrFile && <button disabled={savingUpi} onClick={uploadQr} className="btn btn-primary !w-full mt-3">{savingUpi ? "Uploading…" : "Upload & Save"}</button>}
          </div>
        </div>
      )}

      {tab === "site settings" && (
        <div className="max-w-md space-y-5">
          <p className="text-sm text-muted mb-2">These show in the website footer and power the WhatsApp chat button.</p>
          <div><label className="field-label">Phone</label><input className="field-input" defaultValue={footer.phone} onBlur={(e) => saveFooter({ phone: e.target.value })} placeholder="+91 90000 00000" /></div>
          <div><label className="field-label">Email</label><input className="field-input" defaultValue={footer.email} onBlur={(e) => saveFooter({ email: e.target.value })} placeholder="info@apexathletics.run" /></div>
          <div><label className="field-label">Instagram URL</label><input className="field-input" defaultValue={footer.instagram} onBlur={(e) => saveFooter({ instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
          <div><label className="field-label">Facebook URL</label><input className="field-input" defaultValue={footer.facebook} onBlur={(e) => saveFooter({ facebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
          <div><label className="field-label">WhatsApp Number (country code, no + or spaces)</label><input className="field-input" defaultValue={footer.whatsapp} onBlur={(e) => saveFooter({ whatsapp: e.target.value })} placeholder="919876543210" /></div>
          {savingFooter && <p className="text-xs text-muted">Saving…</p>}
        </div>
      )}
    </div>
  );
}

function TF({ label, value, onBlur, type = "text" }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onBlur(v)} className="field-input" />
    </div>
  );
}
function SF({ label, value, onChange, options }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field-input">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
                    }
