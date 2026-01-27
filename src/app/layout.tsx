import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "القرآن الكريم تلاوة وقراءة وتفسير",
  description: "سور القران الكريم كامل قراءة وتفسير واستماع",
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
