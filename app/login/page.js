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

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-20">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">{mode === "login" ? "Welcome back" : "Join Apex"}</div>
      <h1 className="font-black text-2xl mb-6 text-ink">{mode === "login" ? "Login" : "Sign Up"}</h1>

      <button onClick={loginWithGoogle} className="btn btn-outline !w-full mb-5 flex items-center justify-center gap-3">
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.6 0-14.2 4.3-17.7 10.7z"/>
          <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C39.9 36.6 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1" style={{ background: "#E7E2D9" }} />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1" style={{ background: "#E7E2D9" }} />
      </div>

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
