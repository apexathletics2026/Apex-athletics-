"use client";
import { useRef, useState } from "react";
import { Download } from "lucide-react";

export default function CertificateDownload({ result, founder }) {
  const certRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const download = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(certRef.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Apex-Certificate-${result.certificate_number}.pdf`);
    } catch (e) {
      alert("Could not generate PDF. Please try again.");
    }
    setGenerating(false);
  };

  return (
    <div>
      {/* Hidden off-screen certificate template used for PDF capture */}
      <div style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }}>
        <div
          ref={certRef}
          style={{
            width: "1200px",
            height: "850px",
            background: "linear-gradient(135deg, #FFFDF7 0%, #FFF9E8 100%)",
            padding: "60px",
            fontFamily: "Georgia, serif",
            position: "relative",
            border: "18px solid #15130F",
            boxSizing: "border-box",
          }}
        >
          <div style={{ position: "absolute", inset: "26px", border: "2px solid #C6A700" }} />
          <div style={{ textAlign: "center", position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "20px", letterSpacing: "6px", color: "#C6A700", fontWeight: "bold", marginBottom: "8px" }}>APEX ATHLETICS</div>
            <div style={{ fontSize: "42px", fontWeight: "900", color: "#15130F", letterSpacing: "2px", marginBottom: "6px" }}>CERTIFICATE OF ACHIEVEMENT</div>
            <div style={{ width: "120px", height: "3px", background: "#C6A700", margin: "18px auto 30px" }} />

            <div style={{ fontSize: "16px", color: "#555", marginBottom: "6px" }}>This certificate is proudly presented to</div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#15130F", margin: "10px 0", fontFamily: "'Brush Script MT', cursive" }}>
              {result.full_name}
            </div>
            <div style={{ fontSize: "16px", color: "#555", margin: "10px 0 30px" }}>
              for successfully completing <b>{result.event_name}</b>
              {result.category ? ` in the ${result.category} category` : ""}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "60px", marginBottom: "40px" }}>
              {result.bib_number && (
                <div><div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Bib Number</div><div style={{ fontSize: "20px", fontWeight: "bold" }}>{result.bib_number}</div></div>
              )}
              {result.finish_time && (
                <div><div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Finish Time</div><div style={{ fontSize: "20px", fontWeight: "bold" }}>{result.finish_time}</div></div>
              )}
              {result.position && (
                <div><div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Position</div><div style={{ fontSize: "20px", fontWeight: "bold" }}>{result.position}</div></div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px", padding: "0 40px" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "12px", color: "#888" }}>Certificate No.</div>
                <div style={{ fontSize: "15px", fontWeight: "bold" }}>{result.certificate_number}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                {founder?.signature_url && <img src={founder.signature_url} alt="signature" style={{ height: "50px", marginBottom: "4px" }} crossOrigin="anonymous" />}
                <div style={{ borderTop: "1px solid #333", paddingTop: "4px", fontSize: "13px", fontWeight: "bold" }}>{founder?.name || "Founder"}</div>
                <div style={{ fontSize: "10px", color: "#888" }}>Founder, Apex Athletics</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "#888" }}>Date</div>
                <div style={{ fontSize: "15px", fontWeight: "bold" }}>{new Date(result.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={download} disabled={generating} className="btn btn-primary !w-full">
        <Download size={16}/> {generating ? "Generating PDF…" : "Download Certificate"}
      </button>
    </div>
  );
        }
