"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setMsg(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else router.push("/dashboard");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setErr(error.message);
      else {
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: name, email });
        }
        setMsg("Account created. Check your email to confirm, then log in.");
        setMode("login");
      }
    }
    setLoading(false);
  };

  const forgotPassword = async () => {
    if (!email) { setErr("Enter your email above first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErr(error.message);
    else setMsg("Password reset email sent — check your inbox.");
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-20">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">{mode === "login" ? "Welcome back" : "Join Apex"}</div>
      <h1 className="font-black text-2xl mb-6 text-ink">{mode === "login" ? "Login" : "Sign Up"}</h1>
      <div className="space-y-4">
        {mode === "signup" && (
          <div><label className="field-label">Full Name</label><input className="field-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div><label className="field-label">Email</label><input className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="field-label">Password</label><input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p className="text-xs" style={{ color: "#B3271E" }}>{err}</p>}
        {msg && <p className="text-xs" style={{ color: "#1B7A3B" }}>{msg}</p>}
        <button disabled={loading} className="btn btn-primary !w-full" onClick={submit}>
          {mode === "login" ? "Login" : "Create Account"} <ArrowRight size={15}/>
        </button>
        <button onClick={forgotPassword} className="text-xs w-full text-center text-muted">Forgot password?</button>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-xs w-full text-center font-bold text-accentDark">
          {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
    }
