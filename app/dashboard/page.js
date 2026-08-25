"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [regs, setRegs] = useState([]);
  const [myMedia, setMyMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { router.push("/login"); return; }
      setUser(data.user);
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("*, events(name, event_date)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setRegs(registrations || []);
      const { data: media } = await supabase
        .from("athlete_media")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setMyMedia(media || []);
      setLoading(false);
    })();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const submitMedia = async () => {
    if (!file) { setUploadMsg("Please choose a photo or video first."); return; }
    setUploading(true);
    setUploadMsg("");
    const mediaType = file.type.startsWith("video") ? "video" : "photo";
    const path = `${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage.from("athlete-media").upload(path, file);
    if (uploadError) { setUploadMsg("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("athlete-media").getPublicUrl(path);

    const { error } = await supabase.from("athlete_media").insert({
      user_id: user.id,
      athlete_name: user.user_metadata?.full_name || "Runner",
      media_type: mediaType,
      media_url: pub.publicUrl,
      caption,
      status: "Pending",
    });

    setUploading(false);
    if (error) { setUploadMsg("Something went wrong: " + error.message); return; }

    fetch("/api/notify-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteName: user.user_metadata?.full_name || "Runner", mediaType, caption }),
    }).catch(() => {});

    setUploadMsg("Submitted! Waiting for admin approval.");
    setCaption("");
    setFile(null);
    const { data: media } = await supabase.from("athlete_media").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setMyMedia(media || []);
  };

  if (loading) return <div className="max-w-4xl mx-auto px-5 py-20 text-center text-muted">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-accent">My Account</div>
        <button onClick={logout} className="text-xs font-bold text-muted">Logout</button>
      </div>
      <h1 className="font-black text-2xl mb-1 text-ink">Hi, {user.user_metadata?.full_name || "Runner"}</h1>
      <p className="text-sm mb-8 text-muted">{user.email}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Registrations" value={regs.length} />
        <Stat label="Confirmed" value={regs.filter((r) => r.status === "Confirmed").length} />
        <Stat label="Pending Payment" value={regs.filter((r) => r.status !== "Confirmed").length} />
      </div>

      <h3 className="font-black text-lg mb-4 text-ink">My Registrations</h3>
      <div className="space-y-3 mb-12">
        {regs.length === 0 && <p className="text-sm text-muted">No registrations yet — go register for an event!</p>}
        {regs.map((r) => (
          <div key={r.id} className="border rounded-sm p-4 flex items-center justify-between" style={{ borderColor: "#262626" }}>
            <div>
              <div className="font-bold text-sm">{r.events?.name}</div>
              <div className="text-xs text-muted">{r.registration_code}</div>
            </div>
            <span className="text-xs font-bold" style={{ color: r.status === "Confirmed" ? "#1B7A3B" : "#C6FF00" }}>{r.status}</span>
          </div>
        ))}
      </div>

      <h3 className="font-black text-lg mb-4 text-ink">Share a Photo or Video</h3>
      <div className="border rounded-sm p-5 mb-12" style={{ borderColor: "#262626" }}>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-sm py-6 text-sm cursor-pointer text-muted mb-3" style={{ borderColor: "#262626" }}>
          <Upload size={16}/> {file ? file.name : "Choose photo or video"}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <textarea rows={2} className="field-input mb-3" placeholder="Add a caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        {uploadMsg && <p className="text-xs mb-3" style={{ color: uploadMsg.includes("Submitted") ? "#1B7A3B" : "#B3271E" }}>{uploadMsg}</p>}
        <button disabled={uploading} onClick={submitMedia} className="btn btn-primary !w-full">{uploading ? "Uploading…" : "Submit for Approval"}</button>
      </div>

      <h3 className="font-black text-lg mb-4 text-ink">My Posts</h3>
      <div className="grid grid-cols-3 gap-2">
        {myMedia.map((m) => (
          <div key={m.id} className="relative aspect-square bg-surface rounded-sm overflow-hidden">
            {m.media_type === "video" ? (
              <video src={m.media_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={m.media_url} alt="" className="w-full h-full object-cover" />
            )}
            <span
              className="absolute bottom-1 right-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm"
              style={{
                background: m.status === "Approved" ? "#1B7A3B" : m.status === "Rejected" ? "#B3271E" : "#C6FF00",
                color: m.status === "Pending" ? "#0A0A0A" : "#fff",
              }}
            >
              {m.status}
            </span>
          </div>
        ))}
        {myMedia.length === 0 && <p className="text-sm text-muted col-span-3">No posts yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded-sm p-5" style={{ borderColor: "#262626" }}>
      <div className="text-2xl font-black text-ink">{value}</div>
      <div className="text-xs uppercase font-bold text-muted">{label}</div>
    </div>
  );
           }
