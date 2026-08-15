import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());
    const { status, txnid, amount, productinfo, firstname, email, hash, key } = data;

    if (!txnid) return NextResponse.redirect(new URL(`/payment-failed`, req.url), 303);
    if (status !== "success") return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url), 303);

    const salt = process.env.PAYU_MERCHANT_SALT;
    const udfsReversed = ["", "", "", "", "", "", "", "", "", ""];
    const expectedHashString = [salt, status, ...udfsReversed, email, firstname, productinfo, amount, txnid, key].join("|");
    const expectedHash = crypto.createHash("sha512").update(expectedHashString).digest("hex");

    const verified = expectedHash === hash;
    const supabase = createClient();

    if (verified) {
      const orderNumber = txnid.replace(/^ORD/, "");
      await supabase.from("orders").update({ payment_status: "Paid", razorpay_payment_id: data.mihpayid || "" }).eq("order_number", orderNumber);
      return NextResponse.redirect(new URL(`/payment-success?txnid=${txnid}`, req.url), 303);
    }

    return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url), 303);
  } catch (e) {
    return NextResponse.redirect(new URL(`/payment-failed`, req.url), 303);
  }
                                }
