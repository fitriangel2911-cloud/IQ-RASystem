import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "iQ-RA System — Platform Keuangan Syariah Terintegrasi AI",
  description:
    "Platform keuangan mikro syariah berbasis web dengan mekanisme RAG AI untuk rekomendasi akad dan kepatuhan SAK EP secara otomatis.",
};

import { ThemeProvider } from "@/context/ThemeContext";
import GlobalSiteBackground from "@/components/dashboard/GlobalSiteBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full relative transition-colors duration-300">
        <ThemeProvider>
          <GlobalSiteBackground />
          <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
