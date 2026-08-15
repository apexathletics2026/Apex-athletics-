"use client";
import { useEffect, useState, useRef } from "react";
import { ShoppingBag, Minus, Plus, X, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function StorePage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = cart, 1 = details, 2 = paying
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState(false);
  const formRef = useRef(null);
  const [payuParams, setPayuParams] = useState(null);
  const [form, setForm] = useState({ fullName: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "Active").order("created_at", { ascending: false });
      setProducts(data || []);
    })();
  }, []);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === p.id);
      if (existing) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...p, qty: 1 }];
    });
    setShowCart(true);
  };
  const updateQty = (id, delta) => {
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };
  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const total = cart.reduce((s, i) => s + Number(i.discount_price || i.price) * i.qty, 0);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitOrder = async () => {
    setErr("");
    setPaying(true);
    const { data: u } = await supabase.auth.getUser();
    const orderNo = `ORD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: u?.user?.id || null,
      order_number: orderNo,
      full_name: form.fullName,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      total_amount: total,
      payment_status: "Pending",
    }).select().single();

    if (error) { setErr("Something went wrong: " + error.message); setPaying(false); return; }

    const items = cart.map((i) => ({
      order_id: order.id, product_id: i.id, product_name: i.name,
      unit_price: i.discount_price || i.price, quantity: i.qty,
    }));
    await supabase.from("order_items").insert(items);

    const res = await fetch("/api/payu/initiate-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_number: orderNo,
        amount: total,
        name: form.fullName,
        email: form.email,
        phone: form.mobile,
      }),
    });
    const result = await res.json();
    if (!result.action) { setErr(result.error || "Could not start payment."); setPaying(false); return; }
    setPayuParams(result);
    setPaying(false);
  };

  useEffect(() => {
    if (payuParams && formRef.current) formRef.current.submit();
  }, [payuParams]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Store</div>
          <h1 className="font-black text-3xl text-ink">Apex Gear</h1>
        </div>
        <button onClick={() => setShowCart(true)} className="relative">
          <ShoppingBag size={22}/>
          {cart.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center bg-accent">{cart.length}</span>}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {products.map((p) => (
          <div key={p.id} className="border rounded-sm overflow-hidden bg-white flex flex-col" style={{ borderColor: "#E4DCC5" }}>
            <div className="h-40 md:h-48 bg-gray-100">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-[11px] font-bold uppercase text-muted mb-1">{p.category}</div>
              <div className="font-bold text-sm mb-1 text-ink">{p.name}</div>
              {p.description && <p className="text-xs text-muted mb-2 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-2 mb-3 mt-auto">
                {p.discount_price ? (
                  <><span className="font-black text-ink">₹{p.discount_price}</span><span className="text-xs line-through text-muted">₹{p.price}</span></>
                ) : (
                  <span className="font-black text-ink">₹{p.price}</span>
                )}
              </div>
              <button className="btn btn-dark !w-full !py-2 !text-xs" onClick={() => addToCart(p)}>Add to Cart</button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-sm text-muted col-span-3">No products listed yet.</p>}
      </div>

      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setShowCart(false); setCheckoutStep(0); }} />
          <div className="w-full max-w-sm bg-white h-full p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg">{checkoutStep === 0 ? "Your Cart" : "Delivery Details"}</h3>
              <button onClick={() => { setShowCart(false); setCheckoutStep(0); }}><X /></button>
            </div>

            {checkoutStep === 0 && (
              <>
                {cart.length === 0 && <p className="text-sm text-muted">Cart is empty.</p>}
                <div className="space-y-4">
                  {cart.map((i) => (
                    <div key={i.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-sm overflow-hidden">
                        {i.image_url && <img src={i.image_url} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold">{i.name}</div>
                        <div className="text-xs text-muted">₹{i.discount_price || i.price}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQty(i.id, -1)} className="w-6 h-6 border rounded-sm flex items-center justify-center"><Minus size={12}/></button>
                          <span className="text-xs font-bold">{i.qty}</span>
                          <button onClick={() => updateQty(i.id, 1)} className="w-6 h-6 border rounded-sm flex items-center justify-center"><Plus size={12}/></button>
                        </div>
                      </div>
                      <button onClick={() => removeItem(i.id)} className="text-xs text-muted">Remove</button>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div className="mt-8 pt-4 border-t">
                    <div className="flex justify-between font-black mb-4"><span>Total</span><span>₹{total}</span></div>
                    <button className="btn btn-primary !w-full" onClick={() => setCheckoutStep(1)}>Checkout <ArrowRight size={15}/></button>
                  </div>
                )}
              </>
            )}

            {checkoutStep === 1 && (
              <div className="space-y-4">
                <F label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} />
                <F label="Mobile" value={form.mobile} onChange={(v) => set("mobile", v)} />
                <F label="Email" value={form.email} onChange={(v) => set("email", v)} />
                <F label="Address" value={form.address} onChange={(v) => set("address", v)} />
                <div className="grid grid-cols-2 gap-3">
                  <F label="City" value={form.city} onChange={(v) => set("city", v)} />
                  <F label="State" value={form.state} onChange={(v) => set("state", v)} />
                </div>
                <F label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
                {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}
                <button
                  className="btn btn-primary !w-full disabled:opacity-40"
                  disabled={!form.fullName || !form.mobile || !form.address || paying}
                  onClick={submitOrder}
                >
                  {paying ? "Redirecting to Payment…" : `Pay ₹${total} with PayU`} <ArrowRight size={15}/>
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
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
                                     }
