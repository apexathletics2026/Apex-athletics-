import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());
    const { status, txnid, amount, productinfo, firstname, email, hash, key } = data;

    if (!txnid) {
      return NextResponse.redirect(new URL(`/payment-failed`, req.url), 303);
    }

    if (status !== "success") {
      return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url), 303);
    }

    const salt = process.env.PAYU_MERCHANT_SALT;
    const udfsReversed = ["", "", "", "", "", "", "", "", "", ""];
    const expectedHashString = [salt, status, ...udfsReversed, email, firstname, productinfo, amount, txnid, key].join("|");
    const expectedHash = crypto.createHash("sha512").update(expectedHashString).digest("hex");

    const verified = expectedHash === hash;
    const supabase = createClient();

    if (verified) {
      const tempCode = txnid.replace(/^REG/, "");
      const mihpayid = data.mihpayid || "";

      const { data: pendingReg } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("registration_code", tempCode)
        .maybeSingle();

      let finalCode = tempCode;
      if (pendingReg?.event_id) {
        const { data: codeData, error: codeError } = await supabase.rpc("next_registration_code_for_event", { p_event_id: pendingReg.event_id });
        if (!codeError && codeData) finalCode = codeData;
      }

      await supabase
        .from("event_registrations")
        .update({ status: "Confirmed", registration_code: finalCode, payment_transaction_id: mihpayid })
        .eq("registration_code", tempCode);

      return NextResponse.redirect(new URL(`/payment-success?txnid=${finalCode}`, req.url), 303);
    }

    return NextResponse.redirect(new URL(`/payment-failed?txnid=${txnid}`, req.url), 303);
  } catch (e) {
    return NextResponse.redirect(new URL(`/payment-failed`, req.url), 303);
  }
    }
