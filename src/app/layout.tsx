import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export const metadata: Metadata = {
  title: "القرآن الكريم تلاوة وقراءة وتفسير",
  description: "سور القران الكريم كامل قراءة وتفسير واستماع",
  manifest: "/manifest.webmanifest",
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
      <body>{children}</body>
    </html>
  );
}
