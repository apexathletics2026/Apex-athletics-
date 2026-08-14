"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center text-muted">Loading…</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const params = useSearchParams();
  const txnid = params.get("txnid");

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <CheckCircle2 size={48} color="#E8A93B" className="mx-auto mb-4" />
      <h1 className="font-black text-2xl mb-2 text-ink">Payment Successful</h1>
      <p className="text-sm text-muted mb-6">Your payment has been confirmed. Transaction ID: {txnid}</p>
      <Link href="/dashboard" className="btn btn-primary !w-full">Go to Dashboard <ArrowRight size={15}/></Link>
    </div>
  );
}
