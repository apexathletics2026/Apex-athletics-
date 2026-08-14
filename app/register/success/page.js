"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center text-muted">Loading…</div>}>
      <RegisterSuccessContent />
    </Suspense>
  );
}

function RegisterSuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const order_id = params.get("order_id");
    const registration_id = params.get("registration_id");
    if (!order_id || !registration_id) {
      setStatus("error");
      return;
    }
    fetch(`/api/cashfree/verify?order_id=${order_id}&registration_id=${registration_id}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.paid ? "paid" : "failed"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="max-w-sm mx-auto px-5 py-24 text-center">
      {status === "checking" && <p className="text-sm text-muted">Verifying your payment…</p>}

      {status === "paid" && (
        <>
          <CheckCircle2 size={40} color="#1B7A3B" className="mx-auto mb-4" />
          <h1 className="font-black text-xl mb-2 text-ink">Payment Successful!</h1>
          <p className="text-sm text-muted mb-6">Your registration is confirmed. See you at the start line!</p>
          <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle size={40} color="#B3271E" className="mx-auto mb-4" />
          <h1 className="font-black text-xl mb-2 text-ink">Payment not completed</h1>
          <p className="text-sm text-muted mb-6">
            Your registration is saved as pending. You can retry payment from your dashboard.
          </p>
          <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </>
      )}

      {status === "error" && <p className="text-sm text-muted">Something went wrong. Please contact support.</p>}
    </div>
  );
    }
