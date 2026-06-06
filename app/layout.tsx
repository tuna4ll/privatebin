import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privatebin | Zero-Knowledge Paste Sharing",
  description: "Secure, encrypted, and privacy-focused paste sharing. Encryption happens in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#ededed]">
        {children}
      </body>
    </html>
  );
}
