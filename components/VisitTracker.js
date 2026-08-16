"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const supabase = createClient();
    supabase.from("site_visits").insert({ path: pathname }).then(() => {});
  }, [pathname]);
  return null;
}
