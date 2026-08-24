"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Plus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  const [team, setTeam] = useState([]);
  const [newSerial, setNewSerial] = useState("");
  const [regEventFilter, setRegEventFilter] = useState("All");
  const [mediaList, setMediaList] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("Pending");
  const [visits, setVisits] = useState([]);
  const [expandedReg, setExpandedReg] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [eventImages, setEventImages] = useState([]);

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
    const [{ data: ev }, { data: pr }, { data: sp }, { data: rg }, { data: ord }, { data: tm }, { data: md }, { data: ei }] = await Promise.all([
      supabase.from("events").select("*").order("event_date"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("sponsors").select("*").order("sort_order"),
      supabase.from("event_registrations").select("*, events(name)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("team_members").select("*").order("sort_order"),
      supabase.from("athlete_media").select("*, certificates(certificate_number)").order("created_at", { ascending: false }),
      supabase.from("event_images").select("*").order("sort_order"),
    ]);
    setEvents(ev || []); setProducts(pr || []); setSponsors(sp || []); setRegistrations(rg || []); setOrders(ord || []); setTeam(tm || []); setMediaList(md || []); setEventImages(ei || []);
    const { data: s } = await supabase.from("website_settings").select("value").eq("key", "upi_payment").maybeSingle();
    if (s?.value) setUpi(s.value);
    const { data: f } = await supabase.from("website_settings").select("value").eq("key", "footer_contact").maybeSingle();
    if (f?.value) setFooter(f.value);
    const { data: cert } = await supabase.from("certificates").select("*").order("created_at", { ascending: false });
    setCertificates(cert || []);
    const { data: fd } = await supabase.from("website_settings").select("value").eq("key", "founder").maybeSingle();
    if (fd?.value) setFounder(fd.value);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: vs } = await supabase.from("site_visits").select("created_at").gte("created_at", since);
    setVisits(vs || []);
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
  const linkRegCertificate = async (id, certId) => { await supabase.from("event_registrations").update({ certificate_id: certId || null }).eq("id", id); loadAll(); };

  const addOfflineRegistration = async () => {
    const targetEventId = regEventFilter !== "All" ? regEventFilter : events[0]?.id || null;
    if (!targetEventId) { alert("Please select a specific event first (not \"All\") so numbering can start correctly for it."); return; }
    const { data: codeData, error: codeError } = await supabase.rpc("next_registration_code_for_event", { p_event_id: targetEventId });
    if (codeError || !codeData) { alert("Could not generate the next serial number."); return; }
    const { error } = await supabase.from("event_registrations").insert({
      registration_code: codeData,
      event_id: targetEventId,
      full_name: "New Offline Registrant",
      mobile: "",
      address: "",
      payment_method: "Offline",
      status: "Confirmed",
    });
    if (error) { alert("Something went wrong: " + error.message); return; }
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

  const addEventImage = async (eventId, file) => {
    if (!file) return;
    const count = eventImages.filter((i) => i.event_id === eventId).length;
    if (count >= 10) { alert("Maximum 10 photos allowed per event."); return; }
    const path = `event-${eventId}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("event_images").insert({ event_id: eventId, image_url: pub.publicUrl, sort_order: count });
    loadAll();
  };
  const deleteEventImage = async (id) => { await supabase.from("event_images").delete().eq("id", id); loadAll(); };

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

  const addTeamMember = async () => {
    await supabase.from("team_members").insert({ name: "New Member", role: "Founder" });
    loadAll();
  };
  const updateTeamMember = async (id, patch) => { await supabase.from("team_members").update(patch).eq("id", id); loadAll(); };
  const deleteTeamMember = async (id) => { await supabase.from("team_members").delete().eq("id", id); loadAll(); };
  const uploadTeamPhoto = async (id, file) => {
    if (!file) return;
    const path = `team-${id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (!error) {
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      await updateTeamMember(id, { photo_url: pub.publicUrl });
    }
  };

  const approveMedia = async (id) => { await supabase.from("athlete_media").update({ status: "Approved" }).eq("id", id); loadAll(); };
  const rejectMedia = async (id) => { await supabase.from("athlete_media").update({ status: "Rejected" }).eq("id", id); loadAll(); };
  const deleteMedia = async (id) => { await supabase.from("athlete_media").delete().eq("id", id); loadAll(); };
  const updateMedia = async (id, patch) => { await supabase.from("athlete_media").update(patch).eq("id", id); loadAll(); };
  const linkCertificate = async (id, certId) => { await supabase.from("athlete_media").update({ certificate_id: certId || null }).eq("id", id); loadAll(); };

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

  const tabs = ["overview", "events", "products", "sponsors", "registrations", "orders", "payment settings", "site settings", "certificates", "founder", "team", "analytics", "media"];
  const totalRegs = registrations.length;
  const offlineRegs = registrations.filter((r) => r.payment_method === "Offline").length;
  const onlineRegs = totalRegs - offlineRegs;
  const stats = [
    ["Total Events", events.length],
    ["Total Registrations", totalRegs],
    ["Online", onlineRegs],
    ["Offline", offlineRegs],
    ["Orders", orders.length],
    ["Products", products.length],
    ["Sponsors", sponsors.length],
    ["Pending Payments", registrations.filter((r) => r.status !== "Confirmed").length + orders.filter((o) => o.payment_status !== "Paid").length],
    ["Pending Media", mediaList.filter((m) => m.status === "Pending").length],
    ["Approved Media", mediaList.filter((m) => m.status === "Approved").length],
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
                <div className="mb-3">
                  <label className="field-label">Photos ({eventImages.filter((i) => i.event_id === e.id).length}/10)</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
                    {eventImages.filter((i) => i.event_id === e.id).map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-sm overflow-hidden border" style={{ borderColor: "#E7E2D9" }}>
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => deleteEventImage(img.id)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><Trash2 size={11} color="#fff"/></button>
                      </div>
                    ))}
                  </div>
                  {eventImages.filter((i) => i.event_id === e.id).length < 10 && (
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-3 text-xs cursor-pointer text-muted" style={{ borderColor: "#E7E2D9" }}>
                      <Upload size={14}/> Add photo
                      <input type="file" accept="image/*" className="hidden" onChange={(ev2) => addEventImage(e.id, ev2.target.files?.[0])} />
                    </label>
                  )}
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
                <div className="mb-3">
                  <label className="field-label">Description</label>
                  <textarea rows={3} className="field-input" defaultValue={p.description} onBlur={(e) => updateProduct(p.id, { description: e.target.value })} />
                </div>
                <div className="mb-3">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="h-24 object-cover border mb-2 rounded-sm" style={{ borderColor: "#E7E2D9" }} />}
                  <ProductPhotoUpload productId={p.id} onUploaded={(url) => updateProduct(p.id, { image_url: url })} />
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
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div>
              <label className="field-label">Filter by Event</label>
              <select className="field-input" style={{ width: 240 }} value={regEventFilter} onChange={(e) => setRegEventFilter(e.target.value)}>
                <option value="All">All Events</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={addOfflineRegistration}><Plus size={15}/> Add Offline Registration</button>
          </div>
          <div className="space-y-3">
            {registrations.filter((r) => regEventFilter === "All" || r.event_id === regEventFilter).map((r) => {
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
                      <div className="mt-3 pt-3 border-t grid sm:grid-cols-2 gap-3" style={{ borderColor: "#E7E2D9" }}>
                        <div className="sm:col-span-2 text-[11px] text-muted">Every confirmed registration auto-generates its own certificate. Optionally add finish time / position below for this participant's certificate (e.g. for winners).</div>
                        <TF label="Finish Time (optional)" value={r.finish_time} onBlur={(v) => updateRegistration(r.id, { finish_time: v })} />
                        <TF label="Position (optional)" value={r.position} onBlur={(v) => updateRegistration(r.id, { position: v })} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {registrations.filter((r) => regEventFilter === "All" || r.event_id === regEventFilter).length === 0 && <p className="text-sm text-muted">No registrations for this event yet.</p>}
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

      {tab === "team" && (
        <div>
          <button className="btn btn-primary mb-5" onClick={addTeamMember}><Plus size={15}/> Add Founder / Co-Founder</button>
          <div className="grid sm:grid-cols-2 gap-4">
            {team.map((m) => (
              <div key={m.id} className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9" }}>
                {m.photo_url && <img src={m.photo_url} alt={m.name} className="w-20 h-20 rounded-full object-cover mb-3" />}
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-3 text-xs cursor-pointer text-muted mb-3" style={{ borderColor: "#E7E2D9" }}>
                  <Upload size={14}/> Choose photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadTeamPhoto(m.id, e.target.files?.[0])} />
                </label>
                <div className="space-y-3">
                  <TF label="Name" value={m.name} onBlur={(v) => updateTeamMember(m.id, { name: v })} />
                  <SF label="Role" value={m.role} onChange={(v) => updateTeamMember(m.id, { role: v })} options={["Founder", "Co-Founder"]} />
                  <TF label="Bio" value={m.bio} onBlur={(v) => updateTeamMember(m.id, { bio: v })} />
                  <TF label="Instagram URL" value={m.instagram} onBlur={(v) => updateTeamMember(m.id, { instagram: v })} />
                  <TF label="Facebook URL" value={m.facebook} onBlur={(v) => updateTeamMember(m.id, { facebook: v })} />
                  <TF label="Twitter / X URL" value={m.twitter} onBlur={(v) => updateTeamMember(m.id, { twitter: v })} />
                  <TF label="LinkedIn URL" value={m.linkedin} onBlur={(v) => updateTeamMember(m.id, { linkedin: v })} />
                </div>
                <button onClick={() => deleteTeamMember(m.id)} className="text-xs font-bold flex items-center gap-1 mt-3" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
              </div>
            ))}
            {team.length === 0 && <p className="text-sm text-muted">No team members yet.</p>}
          </div>
        </div>
      )}

      {tab === "media" && (
        <div>
          <div className="flex gap-2 mb-5">
            {["Pending", "Approved", "Rejected", "All"].map((f) => (
              <button key={f} onClick={() => setMediaFilter(f)} className="text-xs font-bold uppercase px-3 py-1.5 rounded-full border"
                style={{ borderColor: mediaFilter === f ? "#C6FF00" : "#262626", background: mediaFilter === f ? "#C6FF00" : "transparent", color: mediaFilter === f ? "#0A0A0A" : "#F5F5F0" }}>
                {f}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {mediaList.filter((m) => mediaFilter === "All" || m.status === mediaFilter).map((m) => (
              <div key={m.id} className="border rounded-sm p-4" style={{ borderColor: "#262626" }}>
                <div className="flex gap-3 mb-3">
                  <div className="w-20 h-20 bg-black/40 rounded-sm overflow-hidden shrink-0">
                    {m.media_type === "video" ? (
                      <video src={m.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={m.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{m.athlete_name}</div>
                    <div className="text-xs text-muted mb-1">{m.caption}</div>
                    <div className="text-xs font-bold" style={{ color: m.status === "Approved" ? "#1B7A3B" : m.status === "Rejected" ? "#B3271E" : "#C6FF00" }}>{m.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <TF label="Views" type="number" value={m.views} onBlur={(v) => updateMedia(m.id, { views: Number(v) })} />
                  <TF label="Likes" type="number" value={m.likes} onBlur={(v) => updateMedia(m.id, { likes: Number(v) })} />
                </div>
                <div className="mb-3">
                  <label className="field-label">Attach Certificate (optional)</label>
                  <select className="field-input" defaultValue={m.certificate_id || ""} onChange={(e) => linkCertificate(m.id, e.target.value)}>
                    <option value="">None</option>
                    {certificates.map((c) => <option key={c.id} value={c.id}>{c.certificate_number} — {c.full_name}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status !== "Approved" && <button onClick={() => approveMedia(m.id)} className="btn btn-primary !py-2 !px-3 !text-xs">Approve</button>}
                  {m.status !== "Rejected" && <button onClick={() => rejectMedia(m.id)} className="btn btn-outline !py-2 !px-3 !text-xs">Reject</button>}
                  <button onClick={() => deleteMedia(m.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#B3271E" }}><Trash2 size={13}/> Delete</button>
                </div>
              </div>
            ))}
            {mediaList.filter((m) => mediaFilter === "All" || m.status === mediaFilter).length === 0 && (
              <p className="text-sm text-muted">No posts in this filter.</p>
            )}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <AnalyticsPanel visits={visits} registrations={registrations} orders={orders} />
      )}
    </div>
  );
}

function AnalyticsPanel({ visits, registrations, orders }) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const inWindow = (rows, sinceMs) => rows.filter((r) => new Date(r.created_at).getTime() >= sinceMs).length;

  const visitStats = [
    ["Last Hour", inWindow(visits, hourAgo)],
    ["Today", inWindow(visits, todayStart.getTime())],
    ["Last 30 Days", visits.length],
  ];
  const regStats = [
    ["Last Hour", inWindow(registrations, hourAgo)],
    ["Today", inWindow(registrations, todayStart.getTime())],
    ["Last 30 Days", inWindow(registrations, now - 30 * 24 * 60 * 60 * 1000)],
  ];
  const orderStats = [
    ["Last Hour", inWindow(orders, hourAgo)],
    ["Today", inWindow(orders, todayStart.getTime())],
    ["Last 30 Days", inWindow(orders, now - 30 * 24 * 60 * 60 * 1000)],
  ];

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const count = visits.filter((v) => v.created_at.slice(0, 10) === key).length;
    days.push({ label, count });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold uppercase tracking-wide text-accentDark mb-3">Visitors</div>
        <div className="grid sm:grid-cols-3 gap-4">
          {visitStats.map(([label, value]) => (
            <div key={label} className="border rounded-sm p-5" style={{ borderColor: "#E7E2D9" }}>
              <div className="text-2xl font-black text-ink">{value}</div>
              <div className="text-xs uppercase font-bold text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="text-xs font-bold uppercase tracking-wide text-accentDark mb-3">Registrations</div>
        <div className="grid sm:grid-cols-3 gap-4">
          {regStats.map(([label, value]) => (
            <div key={label} className="border rounded-sm p-5" style={{ borderColor: "#E7E2D9" }}>
              <div className="text-2xl font-black text-ink">{value}</div>
              <div className="text-xs uppercase font-bold text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="text-xs font-bold uppercase tracking-wide text-accentDark mb-3">Orders</div>
        <div className="grid sm:grid-cols-3 gap-4">
          {orderStats.map(([label, value]) => (
            <div key={label} className="border rounded-sm p-5" style={{ borderColor: "#E7E2D9" }}>
              <div className="text-2xl font-black text-ink">{value}</div>
              <div className="text-xs uppercase font-bold text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-accentDark mb-3">Visitors — Last 30 Days</div>
        <div className="border rounded-sm p-4" style={{ borderColor: "#E7E2D9", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E8A93B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
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
function ProductPhotoUpload({ productId, onUploaded }) {
  const supabase = createClient();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const path = `product-${productId}-${Date.now()}.${file.name.split(".").pop()}`;
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
        <Upload size={14}/> {file ? file.name : "Choose product photo"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {file && <button disabled={uploading} onClick={upload} className="btn btn-primary !py-2 !px-3 !text-xs">{uploading ? "..." : "Upload"}</button>}
    </div>
  );
    }
