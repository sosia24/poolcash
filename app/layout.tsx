import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/services/walletContext";
import {LanguageManager} from "@/components/LanguageManager";
import { Analytics } from "@vercel/analytics/next"
import { translations } from "@/translations";
import AnimatedBackground from "@/components/AnimatedBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoolCash",
  description: "New innovative multi-pool system",
  icons: {
    icon: "/Pool-Cash-Logo.png", // Caminho relativo à pasta /public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden font-sans">
            {/* Animated background (particles) */}
            <div className="absolute inset-0 z-0">
                <AnimatedBackground />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
        <LanguageManager translations={translations}><WalletProvider>
          <div className="w-full min-h-screen relative overflow-hidden">
            <div className="relative flex items-center justify-center min-h-screen bg-overlay z-0 w-full mx-auto">
              {children}
            </div>
          </div>
        </WalletProvider>
        </LanguageManager>
        <Analytics />
        </div>
      </body>
    </html>
  );
}
