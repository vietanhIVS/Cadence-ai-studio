import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence · Workout tracker",
  description: "Plan your training cycle, follow your schedule, and record every workout.",
  icons: {
    icon: { url: "/cadence-icon.png", type: "image/png", sizes: "512x512" },
    shortcut: "/cadence-icon.png",
    apple: "/cadence-icon.png",
  },
  appleWebApp: { capable: true, title: "Cadence", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/plus-jakarta-sans/latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
