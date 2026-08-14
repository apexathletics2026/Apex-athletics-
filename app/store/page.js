"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, Minus, Plus, X, Upload, CheckCircle2, ArrowRight, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function StorePage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 = cart, 1 = details, 2 = payment, 3 = done
  const [upi, setUpi] = useState({ upi_id: "", qr_image_url: "" });
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [form, setForm] = useState({ fullName: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "Active").order("created_at", { ascending: false });
      setProducts(data || []);
      const { data: s } = await supabase.from("website_settings").select("value").eq("key", "upi_payment").maybeSingle();
      if (s?.value) setUpi(s.value);
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
  const copyUpi = async () => { try { await navigator.clipboard.writeText(upi.upi_id); } catch {} };

  const submitOrder = async () => {
    setErr("");
    if (!screenshot) { setErr("Please upload a screenshot of your payment before submitting."); return; }
    setUploading(true);
    const orderNo = `ORD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const fileExt = screenshot.name.split(".").pop();
    const filePath = `${orderNo}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(filePath, screenshot);
    if (uploadError) { setErr("Screenshot upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);

    const { data: u } = await supabase.auth.getUser();
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
      payment_status: "Processing",
      payment_screenshot_url: pub.publicUrl,
    }).select().single();

    if (error) { setErr("Something went wrong: " + error.message); setUploading(false); return; }

    const items = cart.map((i) => ({
      order_id: order.id, product_id: i.id, product_name: i.name,
      unit_price: i.discount_price || i.price, quantity: i.qty,
    }));
    await supabase.from("order_items").insert(items);

    setUploading(false);
    setOrderNumber(orderNo);
    setCheckoutStep(3);
    setCart([]);
  };

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
            <div className="h-40 md:h-48 bg-gray-100" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-[11px] font-bold uppercase text-muted mb-1">{p.category}</div>
              <div className="font-bold text-sm mb-2 flex-1 text-ink">{p.name}</div>
              <div className="flex items-center gap-2 mb-3">
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
              <h3 className="font-black text-lg">
                {checkoutStep === 0 && "Your Cart"}
                {checkoutStep === 1 && "Delivery Details"}
                {checkoutStep === 2 && "Payment"}
                {checkoutStep === 3 && "Order Placed"}
              </h3>
              <button onClick={() => { setShowCart(false); setCheckoutStep(0); }}><X /></button>
            </div>

            {checkoutStep === 0 && (
              <>
                {cart.length === 0 && <p className="text-sm text-muted">Cart is empty.</p>}
                <div className="space-y-4">
                  {cart.map((i) => (
                    <div key={i.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-sm" />
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
                <button
                  className="btn btn-primary !w-full disabled:opacity-40"
                  disabled={!form.fullName || !form.mobile || !form.address}
                  onClick={() => setCheckoutStep(2)}
                >
                  Continue to Payment <ArrowRight size={15}/>
                </button>
              </div>
            )}

            {checkoutStep === 2 && (
              <div className="space-y-5">
                <div className="border rounded-sm p-5 text-center" style={{ borderColor: "#E4DCC5" }}>
                  <div className="font-black text-xl mb-1 text-ink">Pay ₹{total}</div>
                  <div className="text-xs text-muted mb-4">Scan the QR code or pay to the UPI ID below</div>
                  {upi.qr_image_url ? (
                    <img src={upi.qr_image_url} alt="UPI QR" className="w-40 h-40 mx-auto mb-4 border" style={{ borderColor: "#E4DCC5" }} />
                  ) : (
                    <div className="w-40 h-40 mx-auto mb-4 border flex items-center justify-center text-xs text-muted" style={{ borderColor: "#E4DCC5" }}>QR not added yet</div>
                  )}
                  {upi.upi_id && (
                    <button onClick={copyUpi} className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 border rounded-sm" style={{ borderColor: "#E4DCC5" }}>
                      {upi.upi_id} <Copy size={14}/>
                    </button>
                  )}
                </div>
                <div>
                  <label className="field-label">Upload Payment Screenshot</label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted" style={{ borderColor: "#E4DCC5" }}>
                    <Upload size={16}/> {screenshot ? screenshot.name : "Tap to choose screenshot"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
                  </label>
                </div>
                {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}
                <button disabled={uploading} className="btn btn-primary !w-full disabled:opacity-50" onClick={submitOrder}>
                  {uploading ? "Submitting…" : "Submit Order"} <ArrowRight size={15}/>
                </button>
              </div>
            )}

            {checkoutStep === 3 && (
              <div className="text-center py-6">
                <CheckCircle2 size={40} color="#E8A93B" className="mx-auto mb-4" />
                <p className="font-black text-lg mb-1 text-ink">Order Submitted</p>
                <p className="text-xs text-muted mb-4">{orderNumber}</p>
                <p className="text-sm text-muted">We'll confirm once your payment screenshot is verified.</p>
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
