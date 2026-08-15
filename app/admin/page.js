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
  const [orders, setOrders] = useState([]);
  const [upi, setUpi] = useState({ upi_id: "", qr_image_url: "" });
  const [qrFile, setQrFile] = useState(null);
  const [savingUpi, setSavingUpi] = useState(false);
  const [footer, setFooter] = useState({ phone: "", email: "", instagram: "", facebook: "", whatsapp: "" });
  const [savingFooter, setSavingFooter] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [founder, setFounder] = useState({ name: "", bio: "", photo_url: "", signature_url: "" });
  const [savingFounder, setSavingFounder] = useState(false);
  const [founderPhotoFile, setFounderPhotoFile] = useState(null);
  const [founderSigFile, setFounderSigFile] = useState(null);
  const [expandedReg, setExpandedReg] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

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
    const [{ data: ev }, { data: pr }, { data: sp }, { data: rg }, { data: ord }] = await Promise.all([
      supabase.from("events").select("*").order("event_date"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("sponsors").select("*").order("sort_order"),
      supabase.from("event_registrations").select("*, events(name)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
    ]);
    setEvents(ev || []); setProducts(pr || []); setSponsors(sp || []); setRegistrations(rg || []); setOrders(ord || []);
    const { data: s } = await supabase.from("website_settings").select("value").eq("key", "upi_payment").maybeSingle();
    if (s?.value) setUpi(s.value);
    const { data: f } = await supabase.from("website_settings").select("value").eq("key", "footer_contact").maybeSingle();
    if (f?.value) setFooter(f.value);
    const { data: cert } = await supabase.from("certificates").select("*").order("created_at", { ascending: false });
    setCertificates(cert || []);
    const { data: fd } = await supabase.from("website_settings").select("value").eq("key", "founder").maybeSingle();
    if (fd?.value) setFounder(fd.value);
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
  const updateRegistration = async (id, patch) => { await supabase.from("event_registrations").update(patch).eq("id", id); loadAll(); };
  const deleteRegistration = async (id) => { await supabase.from("event_registrations").delete().eq("id", id); loadAll(); };

  const addOfflineRegistration = async () => {
    const { data: codeData, error: codeError } = await supabase.rpc("next_registration_code");
    if (codeError || !codeData) return;
    await supabase.from("event_registrations").insert({
      registration_code: codeData,
      event_id: events[0]?.id || null,
      full_name: "New Offline Registrant",
      mobile: "",
      address: "",
      payment_method: "Offline",
      status: "Confirmed",
    });
    loadAll();
  };

  const approveOrder = async (id) => { await supabase.from("orders").update({ payment_status: "Paid" }).eq("id", id); loadAll(); };
  const undoOrder = async (id) => { await supabase.from("orders").update({ payment_status: "Processing" }).eq("id", id); loadAll(); };

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

  const addCertificate = async () => {
    await supabase.from("certificates").insert({
      certificate_number: `CERT-${Date.now()}`, bib_number: "", full_name: "New Finisher",
      event_name: events[0]?.name || "", category: "", finish_time: "", position: "",
    });
    loadAll();
  };
  const updateCertificate = async (id, patch) => { await supabase.from("certificates").update(patch).eq("id", id); loadAll(); };
  const deleteCertificate = async (id) => { await supabase.from("certificates").delete().eq("id", id); loadAll(); };

  const saveFounder = async (patch) => {
    setSavingFounder(true);
    const next = { ...founder, ...patch };
    await supabase.from("website_settings").upsert({ key: "founder", value: next });
    setFounder(next);
    setSavingFounder(false);
  };
  const uploadFounderPhoto = async () => {
    if (!founderPhotoFile) return;
    setSavingFounder(true);
    const path = `founder-photo-${Date.now()}.${founderPhotoFile.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, founderPhotoFile);
    if (!error) {
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      await saveFounder({ photo_url: pub.publicUrl });
    }
    setFounderPhotoFile(null);
    setSavingFounder(false);
  };
  const uploadFounderSig = async () => {
    if (!founderSigFile) return;
    setSavingFounder(true);
    const path = `founder-sig-${Date.now()}.${founderSigFile.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, founderSigFile);
    if (!error) {
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      await saveFounder({ signature_url: pub.publicUrl });
    }
    setFounderSigFile(null);
    setSavingFounder(false);
  };

  if (checking) return <div className="max-w-6xl mx-auto px-5 py-20 text-center text-muted">Checking access…</div>;

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto px-5 py-20 text-center">
        <ShieldCheck size={28} color="#FF5A1F" className="mx-auto mb-4" />
        <h1 className="font-black text-xl mb-2 text-ink">Not Authorized</h1>
        <p className="text-sm text-muted">This account isn't in the admins list.</p>
      </div>
    );
  }

  const tabs = ["overview", "events", "products", "sponsors", "registrations", "orders", "payment settings", "site settings", "certificates", "founder"];
  const totalRegs = registrations.length;
  const offlineRegs = registrations.filter(r => r.payment_method === "Offline").length;
  const onlineRegs = totalRegs - offlineRegs;
  const stats = [
    ["Total Events", events.length],
    ["Total Registrations", totalRegs],
    ["Online", onlineRegs],
    ["Offline", offlineRegs],
    ["Orders", orders.length],
    ["Products", products.length],
    ["Sponsors", sponsors.length],
    ["Pending Payments", registrations.filter(r => r.status !== "Confirmed").length + orders.filter(o => o.payment_status !== "Paid").length],
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
                  <TF label="Website Link" value={s.website} onBlur={(v) => updateSponsor(s.id, { website: v })} />
                </div>
                <div className="mb-3">
                  {s.logo_url && <img src={s.logo_url} alt={s.name} className="h-16 object-contain border mb-2" style={{ borderColor: "#E7E2D9" }} />}
                  <SponsorLogoUpload sponsorId={s.id} onUploaded={(url) => updateSponsor(s.id, { logo_url: url })} />
                </div>
                <button onClick={() => deleteSponsor(s.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "registrations" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addOfflineRegistration}><Plus size={15}/> Add Offline Registration</button>
          <div className="space-y-3">
            {registrations.map((r) => {
              const open = expandedReg === r.id;
              return (
                <div key={r.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                  <div className="flex flex-wrap items-center gap-4 justify-between">
                    <button className="text-left" onClick={() => setExpandedReg(open ? null : r.id)}>
                      <div className="font-black text-sm">{r.registration_code} — {r.full_name}</div>
                      <div className="text-xs text-muted">{r.events?.name} · {r.mobile} · {r.payment_method}</div>
                      <div className="text-xs font-bold mt-1" style={{ color: r.status === "Confirmed" ? "#1B7A3B" : "#C43D0E" }}>{r.status}</div>
                    </button>
                    <div className="flex items-center gap-3">
                      {r.payment_screenshot_url && (
                        <a href={r.payment_screenshot_url} target="_blank" rel="noreferrer">
                          <img src={r.payment_screenshot_url} alt="Payment proof" className="w-14 h-14 object-cover border rounded-sm" style={{ borderColor: "#E7E2D9" }} />
                        </a>
                      )}
                      {r.status !== "Confirmed" ? (
                        <button onClick={() => approveRegistration(r.id)} className="btn btn-primary !py-2 !px-4 !text-xs">Mark Paid</button>
                      ) : (
                        <button onClick={() => rejectRegistration(r.id)} className="btn btn-outline !py-2 !px-4 !text-xs">Undo</button>
                      )}
                      <button onClick={() => deleteRegistration(r.id)} className="text-xs" style={{ color: "#B3271E" }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-4 pt-4 border-t text-xs" style={{ borderColor: "#E7E2D9" }}>
                      {r.payment_method === "Offline" ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <TF label="Full Name" value={r.full_name} onBlur={(v) => updateRegistration(r.id, { full_name: v })} />
                          <TF label="Mobile" value={r.mobile} onBlur={(v) => updateRegistration(r.id, { mobile: v })} />
                          <TF label="Address" value={r.address} onBlur={(v) => updateRegistration(r.id, { address: v })} />
                          <SF label="Event" value={r.event_id || ""} onChange={(v) => updateRegistration(r.id, { event_id: v })} options={events.map(e => e.id)} />
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                          <Row label="Email" value={r.email} />
                          <Row label="DOB" value={r.dob} />
                          <Row label="Gender" value={r.gender} />
                          <Row label="Address" value={r.address} />
                          <Row label="City / State" value={`${r.city || ""}, ${r.state || ""}`} />
                          <Row label="T-Shirt Size" value={r.tshirt_size} />
                          <Row label="Emergency Contact" value={`${r.emergency_name || ""} — ${r.emergency_phone || ""}`} />
                          <Row label="Payment Method" value={r.payment_method} />
                          <Row label="Transaction ID" value={r.payment_transaction_id} />
                          <Row label="Submitted" value={new Date(r.created_at).toLocaleString()} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {registrations.length === 0 && <p className="text-sm text-muted">No registrations yet.</p>}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.map((o) => {
            const open = expandedOrder === o.id;
            return (
              <div key={o.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <button className="text-left" onClick={() => setExpandedOrder(open ? null : o.id)}>
                    <div className="font-black text-sm">{o.order_number} — {o.full_name}</div>
                    <div className="text-xs text-muted">₹{o.total_amount} · {o.mobile}</div>
                    <div className="text-xs font-bold mt-1" style={{ color: o.payment_status === "Paid" ? "#1B7A3B" : "#C43D0E" }}>{o.payment_status}</div>
                  </button>
                  <div className="flex items-center gap-3">
                    {o.payment_screenshot_url && (
                      <a href={o.payment_screenshot_url} target="_blank" rel="noreferrer">
                        <img src={o.payment_screenshot_url} alt="Payment proof" className="w-14 h-14 object-cover border rounded-sm" style={{ borderColor: "#E7E2D9" }} />
                      </a>
                    )}
                    {o.payment_status !== "Paid" ? (
                      <button onClick={() => approveOrder(o.id)} className="btn btn-primary !py-2 !px-4 !text-xs">Mark Paid</button>
                    ) : (
                      <button onClick={() => undoOrder(o.id)} className="btn btn-outline !py-2 !px-4 !text-xs">Undo</button>
                    )}
                  </div>
                </div>
                {open && (
                  <div className="mt-4 pt-4 border-t text-xs space-y-2" style={{ borderColor: "#E7E2D9" }}>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                      <Row label="Email" value={o.email} />
                      <Row label="Address" value={o.address} />
                      <Row label="City / State" value={`${o.city || ""}, ${o.state || ""}`} />
                      <Row label="Pincode" value={o.pincode} />
                      <Row label="Ordered" value={new Date(o.created_at).toLocaleString()} />
                    </div>
                    <div className="font-bold uppercase text-[10px] text-muted mt-2">Items</div>
                    {(o.order_items || []).map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.product_name} × {it.quantity}</span>
                        <span>₹{it.unit_price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </div>
      )}

      {tab === "payment settings" && (
        <div className="max-w-md">
          <p className="text-sm text-muted mb-6">Backup manual UPI payment option.</p>
          <div className="mb-5">
            <label className="field-label">UPI ID</label>
            <input className="field-input" defaultValue={upi.upi_id} onBlur={(e) => saveUpi({ upi_id: e.target.value })} placeholder="yourname@upi" />
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

      {tab === "certificates" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addCertificate}><Plus size={15}/> Add Certificate</button>
          <div className="space-y-3">
            {certificates.map((c) => (
              <div key={c.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <TF label="Certificate Number" value={c.certificate_number} onBlur={(v) => updateCertificate(c.id, { certificate_number: v })} />
                  <TF label="Bib Number" value={c.bib_number} onBlur={(v) => updateCertificate(c.id, { bib_number: v })} />
                  <TF label="Full Name" value={c.full_name} onBlur={(v) => updateCertificate(c.id, { full_name: v })} />
                  <TF label="Event Name" value={c.event_name} onBlur={(v) => updateCertificate(c.id, { event_name: v })} />
                  <TF label="Category" value={c.category} onBlur={(v) => updateCertificate(c.id, { category: v })} />
                  <TF label="Finish Time" value={c.finish_time} onBlur={(v) => updateCertificate(c.id, { finish_time: v })} />
                  <TF label="Position" value={c.position} onBlur={(v) => updateCertificate(c.id, { position: v })} />
                </div>
                <button onClick={() => deleteCertificate(c.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
            {certificates.length === 0 && <p className="text-sm text-muted">No certificates yet.</p>}
          </div>
        </div>
      )}

      {tab === "founder" && (
        <div className="max-w-md space-y-5">
          <p className="text-sm text-muted mb-2">Shows on the About page and on every certificate.</p>
          <div><label className="field-label">Founder Name</label><input className="field-input" defaultValue={founder.name} onBlur={(e) => saveFounder({ name: e.target.value })} /></div>
          <div><label className="field-label">Bio</label><textarea rows={4} className="field-input" defaultValue={founder.bio} onBlur={(e) => saveFounder({ bio: e.target.value })} /></div>
          <div>
            <label className="field-label">Founder Photo</label>
            {founder.photo_url && <img src={founder.photo_url} alt="Founder" className="w-24 h-24 rounded-full object-cover border mb-3" style={{ borderColor: "#E7E2D9" }} />}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
              <Upload size={16}/> {founderPhotoFile ? founderPhotoFile.name : "Tap to choose photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFounderPhotoFile(e.target.files?.[0] || null)} />
            </label>
            {founderPhotoFile && <button disabled={savingFounder} onClick={uploadFounderPhoto} className="btn btn-primary !w-full mt-3">{savingFounder ? "Uploading…" : "Upload & Save"}</button>}
          </div>
          <div>
            <label className="field-label">Signature Image</label>
            {founder.signature_url && <img src={founder.signature_url} alt="Signature" className="w-40 h-16 object-contain border mb-3" style={{ borderColor: "#E7E2D9" }} />}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
              <Upload size={16}/> {founderSigFile ? founderSigFile.name : "Tap to choose signature image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFounderSigFile(e.target.files?.[0] || null)} />
            </label>
            {founderSigFile && <button disabled={savingFounder} onClick={uploadFounderSig} className="btn btn-primary !w-full mt-3">{savingFounder ? "Uploading…" : "Upload & Save"}</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
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
function SponsorLogoUpload({ sponsorId, onUploaded }) {
  const supabase = createClient();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const path = `sponsor-${sponsorId}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (!error) {
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      onUploaded(pub.publicUrl);
    }
    setFile(null);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-3 text-xs cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
        <Upload size={14}/> {file ? file.name : "Choose logo image"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {file && <button disabled={uploading} onClick={upload} className="btn btn-primary !py-2 !px-3 !text-xs">{uploading ? "..." : "Upload"}</button>}
    </div>
  );
                                   }
