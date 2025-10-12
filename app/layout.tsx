import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClarityScript from "@/components/ClarityScript";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skibens Spooky Spill Forslag",
  description: "Forslag til spooky spill for Halloween stream!",
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
          <Navbar />
          {children}
          <SpeedInsights />
          <ClarityScript />
        </Providers>
      </body>
    </html>
  );
}
