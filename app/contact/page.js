export const metadata = { title: "Contact — Apex Athletics" };

export default function Contact() {
  return (
    <div className="max-w-lg mx-auto px-5 py-14">
      <div className="text-xs font-bold tracking-[0.2em] uppercase text-accentDark mb-3">Get in touch</div>
      <h1 className="font-black text-3xl mb-6 text-ink">Contact</h1>
      <div className="space-y-4">
        <div><label className="field-label">Name</label><input className="field-input" /></div>
        <div><label className="field-label">Email</label><input className="field-input" /></div>
        <div>
          <label className="field-label">Message</label>
          <textarea rows={4} className="field-input" />
        </div>
        <button className="btn btn-primary !w-full">Send Message</button>
      </div>
    </div>
  );
    }
