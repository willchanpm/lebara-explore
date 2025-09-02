import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNav from "@/components/ConditionalNav";
import AuthWrapper from "@/components/AuthWrapper";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { AuthLoadingProvider } from "@/components/AuthLoadingContext";
import { createSupabaseServer } from "@/lib/supabase/server";
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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/AppIcons/Assets.xcassets/AppIcon.appiconset/32.png',
    shortcut: '/AppIcons/Assets.xcassets/AppIcon.appiconset/32.png',
    apple: '/AppIcons/Assets.xcassets/AppIcon.appiconset/180.png',
    // Additional Apple touch icons for better iOS support
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/AppIcons/Assets.xcassets/AppIcon.appiconset/180.png',
        sizes: '180x180',
      },
      {
        rel: 'apple-touch-icon',
        url: '/AppIcons/Assets.xcassets/AppIcon.appiconset/167.png',
        sizes: '167x167',
      },
      {
        rel: 'apple-touch-icon',
        url: '/AppIcons/Assets.xcassets/AppIcon.appiconset/152.png',
        sizes: '152x152',
      },
      {
        rel: 'apple-touch-icon',
        url: '/AppIcons/Assets.xcassets/AppIcon.appiconset/120.png',
        sizes: '120x120',
      },
    ],
  },
  // iOS Add-to-Home support
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lebara Explore',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Lebara Explore',
  },
};

export const viewport = {
  themeColor: '#ff5aa7',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user data on the server using the correct server-side method
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Pass minimal user data to client components
  const userEmail = session?.user?.email || null

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text`}>
        {/* Service Worker registration for PWA functionality */}
        <ServiceWorkerRegister />
        
        {/* Conditional navigation (profile icon and bottom nav) */}
        <ConditionalNav />
        
        {/* Main content area with proper spacing for bottom navigation */}
        <main className="main-with-nav">
          <AuthLoadingProvider>
            <AuthWrapper userEmail={userEmail}>
              {children}
            </AuthWrapper>
          </AuthLoadingProvider>
        </main>
      </body>
    </html>
  );
}
