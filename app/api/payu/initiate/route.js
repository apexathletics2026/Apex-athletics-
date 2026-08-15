import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  const { registration_code, amount, name, email, phone } = await req.json();

  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://apex-athletics-jb11.vercel.app";

  if (!key || !salt) {
    return NextResponse.json({ error: "PayU is not configured." }, { status: 500 });
  }

  const txnid = `REG${registration_code}`;
  const productinfo = "Event Registration";
  const firstname = name || "Guest";
  const emailVal = email || "guest@apexathletics.run";
  const phoneVal = phone || "9999999999";
  const amountVal = String(amount);

  const udfs = ["", "", "", "", "", "", "", "", "", ""];
  const hashString = [key, txnid, amountVal, productinfo, firstname, emailVal, ...udfs, salt].join("|");
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  return NextResponse.json({
    action: "https://secure.payu.in/_payment",
    params: {
      key, txnid, amount: amountVal, productinfo, firstname, email: emailVal, phone: phoneVal,
      surl: `${siteUrl}/api/payu/verify`,
      furl: `${siteUrl}/api/payu/verify`,
      hash,
      service_provider: "payu_paisa",
    },
  });
    }
