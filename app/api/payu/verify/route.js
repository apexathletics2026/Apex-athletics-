import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());
    const { status, txnid, amount, productinfo, firstname, email, hash, key } = data;

    if (!txnid) {
      return NextResponse.redirect(new URL(`/payment-failed`, req.url));
    }

    if (status !== "success") {
      return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url));
    }

    const salt = process.env.PAYU_MERCHANT_SALT;
    const udfsReversed = ["", "", "", "", "", "", "", "", "", ""];
    const expectedHashString = [salt, status, ...udfsReversed, email, firstname, productinfo, amount, txnid, key].join("|");
    const expectedHash = crypto.createHash("sha512").update(expectedHashString).digest("hex");

    const verified = expectedHash === hash;
    const supabase = createClient();

    if (verified) {
      await supabase.from("event_registrations").update({ status: "Confirmed" }).eq("registration_code", txnid.replace(/^REG/, ""));
      return NextResponse.redirect(new URL(`/payment-success?txnid=${txnid}`, req.url));
    }

    return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url));
  } catch (e) {
    return NextResponse.redirect(new URL(`/payment-failed`, req.url));
  }
}
