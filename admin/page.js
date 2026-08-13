"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = ["Events", "Products", "Sponsors", "Registrations"];

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("Events");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("admins")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return <div className="px-5 py-20 text-center text-muted">Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto px-5 py-20 text-center">
        <h1 className="font-black text-xl mb-2 text-ink">Access denied</h1>
        <p className="text-sm text-muted">This account is not an admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">
        Control Center
      </div>
      <h1 className="font-black text-2xl mb-6 text-ink">Admin Panel</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition ${
              tab === t ? "bg-accentDark text-white" : "bg-gray-100 text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Events" && <EventsPanel supabase={supabase} />}
      {tab === "Products" && <ProductsPanel supabase={supabase} />}
      {tab === "Sponsors" && <SponsorsPanel supabase={supabase} />}
      {tab === "Registrations" && <RegistrationsPanel supabase={supabase} />}
    </div>
  );
}

/* ---------- shared field helpers ---------- */

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        className="field-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea
        className="field-input"
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/* ---------- Events ---------- */

function emptyEvent() {
  return {
    name: "", slug: "", category: "", description: "",
    event_date: "", start_time: "", reg_open_date: "", reg_close_date: "",
    location: "", city: "", district: "", state: "", country: "", distance: "",
    fee: "", max_participants: "", status: "Registration Open", banner_url: "",
    rules: "", terms: "", prize_info: "", organizer_info: "", contact_info: "",
  };
}

function EventsPanel({ supabase }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyEvent());
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      ...form,
      fee: form.fee === "" ? null : Number(form.fee),
      max_participants: form.max_participants === "" ? null : Number(form.max_participants),
    };
    if (editingId) {
      await supabase.from("events").update(payload).eq("id", editingId);
    } else {
      await supabase.from("events").insert(payload);
    }
    setForm(emptyEvent());
    setEditingId(null);
    load();
  };

  const edit = (item) => { setForm({ ...emptyEvent(), ...item }); setEditingId(item.id); };
  const remove = async (id) => {
    if (confirm("Delete this event? This cannot be undone.")) {
      await supabase.from("events").delete().eq("id", id);
      load();
    }
  };

  return (
    <div>
      <div className="border rounded-xl p-4 mb-6 space-y-3">
        <h2 className="font-bold text-sm text-ink">{editingId ? "Edit Event" : "Add New Event"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
          <Field label="Event Date" type="date" value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} />
          <Field label="Start Time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
          <Field label="Reg Open Date" type="date" value={form.reg_open_date} onChange={(v) => setForm({ ...form, reg_open_date: v })} />
          <Field label="Reg Close Date" type="date" value={form.reg_close_date} onChange={(v) => setForm({ ...form, reg_close_date: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="District" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
          <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Field label="Distance" value={form.distance} onChange={(v) => setForm({ ...form, distance: v })} />
          <Field label="Fee (₹)" type="number" value={form.fee} onChange={(v) => setForm({ ...form, fee: v })} />
          <Field label="Max Participants" type="number" value={form.max_participants} onChange={(v) => setForm({ ...form, max_participants: v })} />
          <Field label="Banner URL" value={form.banner_url} onChange={(v) => setForm({ ...form, banner_url: v })} />
        </div>
        <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <TextArea label="Rules" value={form.rules} onChange={(v) => setForm({ ...form, rules: v })} />
        <TextArea label="Terms" value={form.terms} onChange={(v) => setForm({ ...form, terms: v })} />
        <TextArea label="Prize Info" value={form.prize_info} onChange={(v) => setForm({ ...form, prize_info: v })} />
        <TextArea label="Organizer Info" value={form.organizer_info} onChange={(v) => setForm({ ...form, organizer_info: v })} />
        <TextArea label="Contact Info" value={form.contact_info} onChange={(v) => setForm({ ...form, contact_info: v })} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save}>
            {editingId ? "Update Event" : "Create Event"}
          </button>
          {editingId && (
            <button className="btn" onClick={() => { setForm(emptyEvent()); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div>
                <p className="font-bold text-sm text-ink">{it.name}</p>
                <p className="text-xs text-muted">{it.event_date} · {it.status}</p>
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-bold text-accentDark" onClick={() => edit(it)}>Edit</button>
                <button className="text-xs font-bold" style={{ color: "#B3271E" }} onClick={() => remove(it.id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Products ---------- */

function emptyProduct() {
  return { name: "", slug: "", description: "", price: "", discount_price: "", sku: "", stock: "", category: "", featured: false, status: "active" };
}

function ProductsPanel({ supabase }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProduct());
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      ...form,
      price: form.price === "" ? null : Number(form.price),
      discount_price: form.discount_price === "" ? null : Number(form.discount_price),
      stock: form.stock === "" ? null : Number(form.stock),
    };
    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert(payload);
    }
    setForm(emptyProduct());
    setEditingId(null);
    load();
  };

  const edit = (item) => { setForm({ ...emptyProduct(), ...item }); setEditingId(item.id); };
  const remove = async (id) => {
    if (confirm("Delete this product?")) {
      await supabase.from("products").delete().eq("id", id);
      load();
    }
  };

  return (
    <div>
      <div className="border rounded-xl p-4 mb-6 space-y-3">
        <h2 className="font-bold text-sm text-ink">{editingId ? "Edit Product" : "Add New Product"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Field label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Field label="Discount Price (₹)" type="number" value={form.discount_price} onChange={(v) => setForm({ ...form, discount_price: v })} />
          <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
          <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
        </div>
        <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Checkbox label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save}>
            {editingId ? "Update Product" : "Create Product"}
          </button>
          {editingId && (
            <button className="btn" onClick={() => { setForm(emptyProduct()); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div>
                <p className="font-bold text-sm text-ink">{it.name}</p>
                <p className="text-xs text-muted">₹{it.price} · stock {it.stock} · {it.status}</p>
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-bold text-accentDark" onClick={() => edit(it)}>Edit</button>
                <button className="text-xs font-bold" style={{ color: "#B3271E" }} onClick={() => remove(it.id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">No products yet.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Sponsors ---------- */

function emptySponsor() {
  return { name: "", logo_url: "", website: "", description: "", category: "", sort_order: "", active: true };
}

function SponsorsPanel({ supabase }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptySponsor());
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sponsors").select("*").order("sort_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, sort_order: form.sort_order === "" ? null : Number(form.sort_order) };
    if (editingId) {
      await supabase.from("sponsors").update(payload).eq("id", editingId);
    } else {
      await supabase.from("sponsors").insert(payload);
    }
    setForm(emptySponsor());
    setEditingId(null);
    load();
  };

  const edit = (item) => { setForm({ ...emptySponsor(), ...item }); setEditingId(item.id); };
  const remove = async (id) => {
    if (confirm("Delete this sponsor?")) {
      await supabase.from("sponsors").delete().eq("id", id);
      load();
    }
  };

  return (
    <div>
      <div className="border rounded-xl p-4 mb-6 space-y-3">
        <h2 className="font-bold text-sm text-ink">{editingId ? "Edit Sponsor" : "Add New Sponsor"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Logo URL" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} />
          <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Sort Order" type="number" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
        </div>
        <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Checkbox label="Active" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save}>
            {editingId ? "Update Sponsor" : "Create Sponsor"}
          </button>
          {editingId && (
            <button className="btn" onClick={() => { setForm(emptySponsor()); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div>
                <p className="font-bold text-sm text-ink">{it.name}</p>
                <p className="text-xs text-muted">{it.category} · {it.active ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-bold text-accentDark" onClick={() => edit(it)}>Edit</button>
                <button className="text-xs font-bold" style={{ color: "#B3271E" }} onClick={() => remove(it.id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">No sponsors yet.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Registrations (read + status update) ---------- */

const REG_STATUSES = ["Pending Payment", "Paid", "Cancelled"];

function RegistrationsPanel({ supabase }) {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: evs } = await supabase.from("events").select("id, name");
    const evMap = {};
    (evs || []).forEach((e) => { evMap[e.id] = e.name; });
    setEvents(evMap);
    setItems(regs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await supabase.from("event_registrations").update({ status }).eq("id", id);
    load();
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.id} className="border rounded-lg px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-sm text-ink">{r.full_name} · {r.registration_code}</p>
              <p className="text-xs text-muted">
                {events[r.event_id] || "Unknown event"} · {r.mobile} · {r.email}
              </p>
              <p className="text-xs text-muted">
                {r.city}{r.district ? `, ${r.district}` : ""}{r.state ? `, ${r.state}` : ""} · T-shirt: {r.tshirt_size || "—"}
              </p>
              <p className="text-xs text-muted">Payment: {r.payment_method || "—"}</p>
              {r.payment_screenshot_url && (
                <a
                  href={r.payment_screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-accentDark underline"
                >
                  View payment screenshot
                </a>
              )}
            </div>
            <select
              className="field-input !w-auto text-xs"
              value={r.status}
              onChange={(e) => updateStatus(r.id, e.target.value)}
            >
              {REG_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted">No registrations yet.</p>}
    </div>
  );
}
