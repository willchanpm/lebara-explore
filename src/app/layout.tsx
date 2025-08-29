import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import ProfileIcon from "@/components/ProfileIcon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LStreet Explorer",
  description: "Explore places and discover new experiences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text`}>
        {/* Profile icon in top right corner */}
        <ProfileIcon />
        
        {/* Main content area with proper spacing for bottom navigation */}
        <main className="min-h-screen pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
