"use client";
import { useState } from "react";
import { X, Play, Eye, Heart, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FeedGrid({ items }) {
  const supabase = createClient();
  const [selected, setSelected] = useState(null);
  const [liked, setLiked] = useState({});

  const openItem = async (item) => {
    setSelected(item);
    await supabase.from("athlete_media").update({ views: (item.views || 0) + 1 }).eq("id", item.id);
  };

  const toggleLike = async (item) => {
    if (liked[item.id]) return;
    setLiked((l) => ({ ...l, [item.id]: true }));
    await supabase.from("athlete_media").update({ likes: (item.likes || 0) + 1 }).eq("id", item.id);
    setSelected((s) => (s && s.id === item.id ? { ...s, likes: (s.likes || 0) + 1 } : s));
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted">No approved posts yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => (
          <button key={item.id} onClick={() => openItem(item)} className="relative aspect-square bg-surface overflow-hidden group">
            {item.media_type === "video" ? (
              <>
                <video src={item.media_url} className="w-full h-full object-cover" muted />
                <div className="absolute top-2 right-2"><Play size={16} fill="#fff" color="#fff" /></div>
              </>
            ) : (
              <img src={item.media_url} alt={item.caption || "post"} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-3 text-white text-xs font-bold">
                <span className="flex items-center gap-1"><Heart size={14} fill="#fff"/> {item.likes || 0}</span>
                <span className="flex items-center gap-1"><Eye size={14}/> {item.views || 0}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="max-w-lg w-full bg-surface rounded-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#262626" }}>
              <span className="font-bold text-sm text-ink">{selected.athlete_name}</span>
              <button onClick={() => setSelected(null)}><X size={18} className="text-ink" /></button>
            </div>
            <div className="bg-black">
              {selected.media_type === "video" ? (
                <video src={selected.media_url} controls autoPlay className="w-full max-h-[70vh] object-contain" />
              ) : (
                <img src={selected.media_url} alt={selected.caption || "post"} className="w-full max-h-[70vh] object-contain" />
              )}
            </div>
            <div className="p-4">
              {selected.caption && <p className="text-sm text-ink mb-3">{selected.caption}</p>}
              <div className="flex items-center gap-4 mb-3">
                <button onClick={() => toggleLike(selected)} className="flex items-center gap-1 text-sm font-bold text-ink">
                  <Heart size={18} color={liked[selected.id] ? "#C6FF00" : "currentColor"} fill={liked[selected.id] ? "#C6FF00" : "none"} /> {selected.likes || 0}
                </button>
                <span className="flex items-center gap-1 text-sm text-muted"><Eye size={16}/> {selected.views || 0}</span>
              </div>
              {selected.certificates && (
                <div className="border rounded-sm p-3 flex items-center gap-2" style={{ borderColor: "#262626" }}>
                  <Award size={18} color="#C6FF00" />
                  <div className="text-xs">
                    <div className="font-bold text-ink">{selected.certificates.full_name}</div>
                    <div className="text-muted">{selected.certificates.event_name} · {selected.certificates.certificate_number}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
    }
