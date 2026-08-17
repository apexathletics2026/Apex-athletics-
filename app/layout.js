import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VisitTracker from "@/components/VisitTracker";

export const metadata = {
  title: "Apex Athletics — Marathons, Running & Fitness Events",
  description: "Apex Athletics organizes marathons, running, fitness and adventure events. Register for upcoming races, shop event gear, and track your race history.",
  manifest: "/manifest.json",
  themeColor: "#0A0A0A",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Apex Athletics",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <VisitTracker />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
    }
