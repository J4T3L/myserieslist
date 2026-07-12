import type { Metadata } from "next";
import "./globals.css";
import "./components.css";
import "./pages.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import SettingsModal from "@/components/SettingsModal";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "CineTrack - TV Series Tracker & Discovery",
  description: "Track and manage your TV Series watchlist with ease",
};

import { NextAuthProvider } from "@/components/NextAuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>
          <AppProvider>
            <div className="app-container">
            {/* Background Ambient Glow Blobs */}
            <div className="glow-bg-container">
              <div className="glow-blob blob-purple"></div>
              <div className="glow-blob blob-pink"></div>
              <div className="glow-blob blob-cyan"></div>
            </div>

            <Navbar />
            <main style={{ marginTop: "100px" }}>{children}</main>
            <Footer />

            <AuthModal />
            <SettingsModal />
            <ToastContainer />
          </div>
        </AppProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
