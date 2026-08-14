import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  const body = await req.formData();
  const data = Object.fromEntries(body.entries());
  const { status, txnid, amount, productinfo, firstname, email, hash, key } = data;

  const salt = process.env.PAYU_MERCHANT_SALT;
  const expectedHash = crypto.createHash("sha512")
    .update(`${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`)
    .digest("hex");

  const verified = expectedHash === hash;
  const supabase = createClient();

  if (verified && status === "success") {
    if (txnid.startsWith("REG-")) {
      await supabase.from("event_registrations").update({ status: "Confirmed", payment_method: "PayU" }).eq("registration_code", txnid.replace("REG-", ""));
    } else if (txnid.startsWith("ORD-")) {
      await supabase.from("orders").update({ payment_status: "Paid" }).eq("order_number", txnid.replace("ORD-", ""));
    }
    return NextResponse.redirect(new URL(`/payment-success?txnid=${txnid}`, req.url));
  }

  return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url));
}
