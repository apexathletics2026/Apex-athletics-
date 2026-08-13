# MANUAL SETUP REQUIRED — Apex Athletics

Follow these in order. Steps 1–2 are already partly done for you.

## 1. Supabase (already created) ✅
Your project is live:
- URL: `https://mapcodhafmoyyabrmwxr.supabase.co`
- Publishable key: already filled into `.env.local.example`

**Still to do:**
1. Copy `.env.local.example` to a new file named `.env.local`
2. In the Supabase dashboard, open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**. This creates all tables, security rules, and seed data (your Aug 19 marathon + 2 sample sponsors).

## 2. Create your admin account
1. Deploy or run the site (see Step 5 below)
2. Go to `/login` on the live site and **sign up** using `theshakir01@gmail.com`
3. Check that inbox and confirm the email (Supabase sends a confirmation link by default)
4. Back in Supabase → **SQL Editor**, run:
   ```sql
   insert into admins (id, email)
   select id, email from auth.users where email = 'theshakir01@gmail.com';
   ```
5. Now `/admin` will work for that account.

## 3. Razorpay (payments) — connect when ready
1. Go to razorpay.com/signup, create an account
2. Dashboard → **Settings → API Keys → Generate Test Key**
3. Copy the **Key Id** and **Key Secret**
4. Paste them into `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_here
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   ```
5. Open `app/api/checkout/create-order/route.js` and `app/api/checkout/verify/route.js` — each has a commented working example. Uncomment and wire it into the registration/checkout flow.
6. When you're ready to accept real money, complete Razorpay's KYC/business verification to switch from Test mode to Live mode, and swap in your Live keys.

**Until Razorpay is connected:** registrations still work and are saved to the database with status `Pending Payment` — nothing is lost, you just can't collect payment yet.

## 4. Email OTP / password reset
Supabase Auth handles "Forgot password" out of the box (already wired up in `/login`) — it sends a reset link via Supabase's built-in email service. For OTP-style login (a code instead of a link) or to send emails from your own domain, go to Supabase → **Authentication → Providers → Email** and configure a custom SMTP provider (e.g. Resend, SendGrid) — free tiers available.

## 5. Deploy (free)
1. Push this project to a GitHub repository
2. Go to vercel.com → sign up with GitHub → **Import Project** → select this repo
3. In Vercel's project settings → **Environment Variables**, add everything from your `.env.local` (all 5 keys)
4. Deploy. Vercel gives you a free `yourproject.vercel.app` URL immediately
5. Later, buy a domain (e.g. apexathletics.in) and connect it in Vercel → **Domains**

## 6. Running locally (optional, needs Node.js on a computer)
```
npm install
npm run dev
```
Open http://localhost:3000

## What's already working right now
- Homepage, Events, Event Details — pulling live from Supabase
- Registration — saves to database with a unique ID, status "Pending Payment"
- Login/Signup/Forgot Password — real Supabase Auth
- User Dashboard — shows only that user's own registrations (enforced by Row Level Security)
- Admin Panel (`/admin`) — add/edit/delete Events, Products, Sponsors; view all Registrations
- Store, Sponsors pages — pull live from Supabase

## What still needs Razorpay before it's "real"
- Registration payment collection
- Store checkout / order creation
- Marking a registration or order as actually "Paid"
