"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/E4jcoDhYGv30eGMSVbXimp?s=cl&p=a&ilr=0";

function SuccessContent() {
  const params = useSearchParams();
  const txnid = params.get("txnid");

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <CheckCircle2 size={48} color="#E8A93B" className="mx-auto mb-4" />
      <h1 className="font-black text-2xl mb-2 text-ink">Registration Complete</h1>
      <p className="text-sm text-muted mb-6">
        {txnid ? `Your payment has been confirmed. Transaction ID: ${txnid}` : "Your payment has been confirmed."}
      </p>

      <a
        href={WHATSAPP_GROUP_LINK}
        target="_blank"
        rel="noreferrer"
        className="btn !w-full mb-3 flex items-center justify-center gap-2"
        style={{ background: "#25D366", color: "#fff" }}
      >
        <MessageCircle size={16}/> Join Runners WhatsApp Group
      </a>

      <Link href="/dashboard" className="btn btn-primary !w-full">Go to Dashboard <ArrowRight size={15}/></Link>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-5 py-24 text-center text-muted">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
    }
