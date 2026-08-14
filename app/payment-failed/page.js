"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center text-muted">Loading…</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}

function PaymentFailedContent() {
  const params = useSearchParams();
  const txnid = params.get("txnid");

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <XCircle size={48} color="#B3271E" className="mx-auto mb-4" />
      <h1 className="font-black text-2xl mb-2 text-ink">Payment Failed</h1>
      <p className="text-sm text-muted mb-6">Your payment could not be completed. Transaction ID: {txnid}</p>
      <Link href="/events" className="btn btn-primary !w-full">Try Again</Link>
    </div>
  );
}
