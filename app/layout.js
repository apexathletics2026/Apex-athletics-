import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Apex Athletics — Marathons, Running & Fitness Events",
  description: "Apex Athletics organizes marathons, running, fitness and adventure events. Register for upcoming races, shop event gear, and track your race history.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
