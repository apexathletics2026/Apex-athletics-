import { NextResponse } from "next/server";

export async function POST(req) {
  const { fullName, eventName, mobile, registrationCode } = await req.json();

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
        subject: `New Registration: ${fullName} — ${eventName}`,
        html: `
          <h2>New Registration Received</h2>
          <p><b>Name:</b> ${fullName}</p>
          <p><b>Event:</b> ${eventName}</p>
          <p><b>Mobile:</b> ${mobile}</p>
          <p><b>Registration ID:</b> ${registrationCode}</p>
          <p>Check the Admin Panel to verify the payment screenshot.</p>
        `,
      }),
    });
    return NextResponse.json({ sent: true });
  } catch (e) {
    return NextResponse.json({ sent: false });
  }
        }
