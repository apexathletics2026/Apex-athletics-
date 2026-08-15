import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  const { registration_id, amount, name, email, phone } = await req.json();

  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apex-athletics-jb11.vercel.app";

  if (!key || !salt) {
    return NextResponse.json({ error: "PayU is not configured. Check environment variables." }, { status: 500 });
  }

  const txnid = `REG${registration_id ? registration_id.replace(/-/g, "").slice(0, 15) : Date.now()}`;
  const productinfo = "Event Registration";
  const firstname = name || "Guest";

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}||||||||||${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  return NextResponse.json({
    action: "https://secure.payu.in/_payment",
    params: {
      key, txnid, amount: String(amount), productinfo, firstname, email: email || "guest@apexathletics.run", phone: phone || "9999999999",
      surl: `${siteUrl}/api/payu/verify`,
      furl: `${siteUrl}/api/payu/verify`,
      hash,
      service_provider: "payu_paisa",
    },
  });
}
