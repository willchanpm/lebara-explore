import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNav from "@/components/ConditionalNav";
import AuthWrapper from "@/components/AuthWrapper";
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
  title: "Lebara Explore",
  description: "Explore places and discover new experiences",
  icons: {
    icon: '/AppIcons/Assets.xcassets/AppIcon.appiconset/32.png',
    shortcut: '/AppIcons/Assets.xcassets/AppIcon.appiconset/32.png',
    apple: '/AppIcons/Assets.xcassets/AppIcon.appiconset/180.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text`}>
        {/* Conditional navigation (profile icon and bottom nav) */}
        <ConditionalNav />
        
        {/* Main content area with proper spacing for bottom navigation */}
        <main className="main-with-nav">
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </main>
      </body>
    </html>
  );
}
