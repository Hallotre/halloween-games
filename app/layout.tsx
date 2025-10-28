import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClarityScript from "@/components/ClarityScript";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import Image from "next/image";
import EmoteModal from "@/components/EmoteModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skibens Spooky Spill Forslag",
  description: "Forslag til spooky spill for Halloween stream!",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${inter.className} bg-gray-900 min-h-screen`}>
        <GoogleAnalytics />
        <Providers>
          {/* Foreground emote modal */}
          <EmoteModal />
          <Navbar />
          {children}
          <SpeedInsights />
          <ClarityScript />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
