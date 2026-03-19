import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export const metadata: Metadata = {
  title: "القرآن الكريم تلاوة وقراءة وتفسير",
  description: "سور القران الكريم كامل قراءة وتفسير واستماع",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "KZ9kjW9cdTI7kG6wOQwGtzKvHM1XJVpq3SO7YH4VXzc",
  },
  openGraph: {
    title: "القرآن الكريم تلاوة وقراءة وتفسير",
    description: "سور القران الكريم كامل قراءة وتفسير واستماع",
    locale: "ar",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "القرآن الكريم تلاوة وقراءة وتفسير",
    description: "سور القران الكريم كامل قراءة وتفسير واستماع",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
