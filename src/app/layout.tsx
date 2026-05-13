import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IQ-RA System — Platform Keuangan Syariah Terintegrasi AI",
  description:
    "Platform keuangan mikro syariah berbasis web dengan mekanisme RAG AI untuk rekomendasi akad dan kepatuhan SAK EP secara otomatis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#02130e] relative">
        {/* Global background pattern */}
        <div className="site-bg-wrapper" style={{ backgroundColor: '#02130e' }}>
          <div className="site-bg-pattern" />
          <div className="site-bg-overlay" />
        </div>
        {children}
      </body>
    </html>
  );
}
