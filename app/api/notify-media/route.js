import { NextResponse } from "next/server";

export async function POST(req) {
  const { athleteName, mediaType, caption } = await req.json();

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Apex Athletics <onboarding@resend.dev>",
        to: "theshakir01@gmail.com",
        subject: `New ${mediaType} submitted by ${athleteName}`,
        html: `
          <h2>New Media Submitted for Approval</h2>
          <p><b>Athlete:</b> ${athleteName}</p>
          <p><b>Type:</b> ${mediaType}</p>
          <p><b>Caption:</b> ${caption || "(none)"}</p>
          <p>Go to the Admin Panel → media tab to review and approve.</p>
        `,
      }),
    });
    return NextResponse.json({ sent: true });
  } catch (e) {
    return NextResponse.json({ sent: false });
  }
          }
