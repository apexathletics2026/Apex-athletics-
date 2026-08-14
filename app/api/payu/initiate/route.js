import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { registration_id, amount, name, email, phone } = body;

    if (!registration_id || !amount || !phone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const isProd = process.env.NEXT_PUBLIC_PAYU_MODE === "production";
    const payuUrl = isProd ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apex-athletics-jb11.vercel.app";

    const txnid = "APX" + Date.now().toString().slice(-10);
    const productinfo = "Event Registration";
    const firstname = (name || "Runner").split(" ")[0].slice(0, 60);
    const cleanEmail = email && email.trim() ? email.trim() : "guest@apexathletics.in";
    const amt = Number(amount).toFixed(2);

    // PayU request hash sequence:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashSeq = `${key}|${txnid}|${amt}|${productinfo}|${firstname}|${cleanEmail}|${registration_id}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashSeq).digest("hex");

    return NextResponse.json({
      action: payuUrl,
      params: {
        key,
        txnid,
        amount: amt,
        productinfo,
        firstname,
        email: cleanEmail,
        phone,
        surl: `${siteUrl}/api/payu/response`,
        furl: `${siteUrl}/api/payu/response`,
        udf1: registration_id,
        hash,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error starting payment." }, { status: 500 });
  }
      }
