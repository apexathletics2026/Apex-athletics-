import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  const { amount, productinfo, firstname, email, phone, txnid, surl, furl } = await req.json();

  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  return NextResponse.json({
    action: "https://secure.payu.in/_payment",
    params: {
      key, txnid, amount, productinfo, firstname, email, phone,
      surl, furl, hash,
      service_provider: "payu_paisa",
    },
  });
      }
