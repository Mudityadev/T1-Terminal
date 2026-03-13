import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Geist } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "T1 Terminal — Open Source Financial Intelligence",
  description: "Bloomberg-grade financial intelligence terminal. Real-time market data, live news wire, and global intelligence for professionals, students, journalists, and government organizations. Free and open-source.",
  keywords: ["bloomberg terminal", "financial data", "market intelligence", "real-time news", "open source", "UPSC", "geopolitics"],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  authors: [{ name: 'Muditya Raghav', url: 'https://mudityadev.vercel.app/' }],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className={`${jetbrainsMono.variable} ${geist.variable} font-sans antialiased bg-[var(--t1-bg-primary)] text-[var(--t1-text-primary)]`}
      >
        <AuthProvider>
          <AnalyticsWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
