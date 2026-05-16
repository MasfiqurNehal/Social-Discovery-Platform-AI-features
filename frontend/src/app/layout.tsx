import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "./providers";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ChatbotWidget from "@/components/shared/ChatbotWidget";

export const metadata: Metadata = {
  title: "VibeSpot | Find your vibe in Dhaka",
  description: "Community-powered place and event discovery platform serving Dhaka's urban population.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('vibespot-theme')||'dark';document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="flex-1 relative z-0">{children}</main>
            <Footer />
            <ChatbotWidget />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
